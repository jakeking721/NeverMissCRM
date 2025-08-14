import { supabase } from "@/utils/supabaseClient";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function fetchForms() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("campaign_forms")
    .select("*")
    .eq("owner_id", userId);
  if (error) throw error;
  return (
    data?.map((f: any) => ({
      ...f,
      schema_json: {
        blocks: f?.schema_json?.blocks || [],
        style: f?.schema_json?.style || {},
      },
    })) || []
  );
}

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

export async function saveForm(payload: any) {
  const userId = await requireUserId();
  if (!payload?.slug) {
    throw new Error("Slug is required");
  }
  const { schema_json, ...rest } = payload;
  const blocks = schema_json?.blocks || [];
  const style = schema_json?.style || {};
  const { data, error } = await supabase
    .from("campaign_forms")
    .upsert({ ...rest, owner_id: userId, schema_json: { blocks, style } })
    .select()
    .single();
  if (error) throw error;
  return data;
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
