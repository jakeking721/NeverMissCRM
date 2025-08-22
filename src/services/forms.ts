import { supabase, SUPABASE_URL } from "@/utils/supabaseClient";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

// Fetch all forms for current user (latest version only)
export async function fetchForms() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("campaign_forms")
    .select(
      "id, title, description, created_at, form_versions(id, version_number, version_label)"
    )
    .eq("owner_id", userId)
    .order("version_number", {
      foreignTable: "form_versions",
      ascending: false,
    })
    .limit(1, { foreignTable: "form_versions" });
  if (error) throw error;
  return (data ?? []).map((f: any) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    created_at: f.created_at,
    form_version_id: f.form_versions?.[0]?.id,
    version_number: f.form_versions?.[0]?.version_number,
    version_label: f.form_versions?.[0]?.version_label,
  }));
}

// Fetch specific form with latest version
export async function fetchForm(id: string) {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("campaign_forms")
    .select(
      "id, title, description, form_versions(id, version_number, version_label, schema_json)"
    )
    .eq("id", id)
    .eq("owner_id", userId)
    .order("version_number", {
      foreignTable: "form_versions",
      ascending: false,
    })
    .limit(1, { foreignTable: "form_versions" })
    .single();
  if (error) throw error;
  const version = (data as any).form_versions?.[0] || {};
  const blocks = version.schema_json?.blocks || [];
  const style = version.schema_json?.style || {};
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    form_version_id: version.id,
    version_number: version.version_number,
    version_label: version.version_label,
    schema_json: { blocks, style },
  };
}

// Save a form by creating a new version
export async function saveForm(payload: any) {
  const userId = await requireUserId();
  const { id, title, description, schema_json } = payload;
  const blocks = schema_json?.blocks || [];
  const style = schema_json?.style || {};

  if (!title?.trim()) throw new Error("Title is required.");
  if (!Array.isArray(blocks)) throw new Error("Fields JSON is required.");
  if (!style.backgroundColor) throw new Error("Background color is required.");

  if (id) {
    const { error: updErr } = await supabase
      .from("campaign_forms")
      .update({ title, description: description ?? null })
      .eq("id", id)
      .eq("owner_id", userId);
    if (updErr) handleError("PATCH", updErr, "campaign_forms");

    const { data: latest, error: latestErr } = await supabase
      .from("form_versions")
      .select("version_number")
      .eq("form_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestErr) handleError("GET", latestErr, "form_versions");
    const nextVersion = (latest?.version_number || 0) + 1;
    const versionLabel = `${title} v${nextVersion}`;
    const { data, error } = await supabase
      .from("form_versions")
      .insert({
        form_id: id,
        owner_id: userId,
        version_number: nextVersion,
        schema_json: { blocks, style },
        version_label: versionLabel,
      })
      .select()
      .single();
    if (error) handleError("POST", error, "form_versions");
    return { id, title, description, ...data };
  } else {
    const { data: form, error: formErr } = await supabase
      .from("campaign_forms")
      .insert({ owner_id: userId, title, description: description ?? null })
      .select()
      .single();
    if (formErr) handleError("POST", formErr, "campaign_forms");
    const versionLabel = `${title} v1`;
    const { data, error } = await supabase
      .from("form_versions")
      .insert({
        form_id: form.id,
        owner_id: userId,
        version_number: 1,
        schema_json: { blocks, style },
        version_label: versionLabel,
      })
      .select()
      .single();
    if (error) handleError("POST", error, "form_versions");
    return { ...form, ...data };
  }
}

function handleError(method: string, error: any, resource: string): never {
  if (import.meta.env.DEV) {
    console.error(
      `[Supabase] ${method} ${SUPABASE_URL}/rest/v1/${resource}?select=*`,
      error,
    );
  }
  const status = (error as any)?.status;
  if (status === 401 || status === 403) {
    throw new Error("Not authorized to save form.");
  }
  if (status === 409) {
    throw new Error("Form already exists.");
  }
  throw new Error((error as any)?.message || "Failed to save form.");
}

export async function deleteForm(id: string) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("campaign_forms")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw error;
}
