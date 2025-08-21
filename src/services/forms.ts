import { supabase } from "@/utils/supabaseClient";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

// Fetch all forms for current user
export async function fetchForms() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("forms")
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
    .from("forms")
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

  if (id) {
    const { data, error } = await supabase
      .from("forms")
      .update({
        title,
        description: description ?? null,
        schema_json: { blocks, style },
      })
      .eq("id", id)
      .eq("owner_id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("forms")
      .insert({
        owner_id: userId,
        title,
        description: description ?? null,
        schema_json: { blocks, style },
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
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
