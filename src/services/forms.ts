import { supabase } from "@/utils/supabaseClient";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

// Fetch all form versions for current user
export async function fetchForms() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("forms")
    .select("id, title, version, created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Fetch specific form version
export async function fetchForm(id: string, version?: number) {
  const userId = await requireUserId();
  let query = supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .order("version", { ascending: false });
  if (version) query = query.eq("version", version).limit(1);
  const { data, error } = await query.single();
  if (error) throw error;
  const blocks = data?.schema_json?.blocks || [];
  const style = data?.schema_json?.style || {};
  return { ...data, schema_json: { blocks, style } };
}

// Save form creating a new version each time
export async function saveForm(payload: any) {
  const userId = await requireUserId();
  const { id, title, schema_json } = payload;
  const blocks = schema_json?.blocks || [];
  const style = schema_json?.style || {};

  let version = 1;
  if (id) {
    const { data: latest, error: vErr } = await supabase
      .from("forms")
      .select("version")
      .eq("id", id)
      .eq("owner_id", userId)
      .order("version", { ascending: false })
      .limit(1);
    if (vErr) throw vErr;
    version = (latest?.[0]?.version ?? 0) + 1;
  }

  const insertPayload = {
    id: id ?? undefined,
    owner_id: userId,
    title,
    schema_json: { blocks, style },
    version,
  };
  const { data, error } = await supabase
    .from("forms")
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteForm(id: string) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("forms")
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
