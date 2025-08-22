import { supabase, SUPABASE_URL } from "@/utils/supabaseClient";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

// Fetch all forms for current user
export async function fetchForms() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("campaign_forms")
    .select("id, title, description, created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Fetch specific form
export async function fetchForm(id: string) {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("campaign_forms")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();
  if (error) throw error;
  const blocks = data?.schema_json?.blocks || [];
  const style = data?.schema_json?.style || {};
  return { ...data, schema_json: { blocks, style } };
}

// Save a form (insert or update)
export async function saveForm(payload: any) {
  const userId = await requireUserId();
  const { id, title, description, schema_json } = payload;
  const blocks = schema_json?.blocks || [];
  const style = schema_json?.style || {};

  if (!title?.trim()) throw new Error("Title is required.");
  if (!Array.isArray(blocks)) throw new Error("Fields JSON is required.");
  if (!style.backgroundColor) throw new Error("Background color is required.");

  const table = supabase.from("campaign_forms");

  if (id) {
    const { data, error } = await table
      .update({
        title,
        description: description ?? null,
        schema_json: { blocks, style },
      })
      .eq("id", id)
      .eq("owner_id", userId)
      .select()
      .single();
    if (error) handleError("PATCH", error);
    return data;
  } else {
    const { data, error } = await table
      .insert([
        {
          owner_id: userId,
          title,
          description: description ?? null,
          schema_json: { blocks, style },
        },
      ])
      .select()
      .single();
    if (error) handleError("POST", error);
    return data;
  }
}

function handleError(method: string, error: any): never {
  if (import.meta.env.DEV) {
    console.error(
      `[Supabase] ${method} ${SUPABASE_URL}/rest/v1/campaign_forms?select=*`,
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

// Link a form version to a campaign
export async function linkFormToCampaign(
  campaignId: string,
  formId: string,
  formVersion: number
) {
  await requireUserId();
  const { error } = await supabase
    .from("campaign_forms")
    .upsert({ campaign_id: campaignId, form_id: formId, form_version: formVersion });
  if (error) throw error;
}
