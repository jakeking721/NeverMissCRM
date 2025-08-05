import { supabase } from "@/utils/supabaseClient";

export async function fetchForms() {
  const { data, error } = await supabase.from("campaign_forms").select("*");
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
  const { data, error } = await supabase
    .from("campaign_forms")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  const blocks = data?.schema_json?.blocks || [];
  const style = data?.schema_json?.style || {};
  return { ...data, schema_json: { blocks, style } };
}

export async function saveForm(payload: any) {
  if (!payload?.slug) {
    throw new Error("Slug is required");
  }
  const { schema_json, ...rest } = payload;
  const blocks = schema_json?.blocks || [];
  const style = schema_json?.style || {};
  const { data, error } = await supabase
    .from("campaign_forms")
    .upsert({ ...rest, schema_json: { blocks, style } })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteForm(id: string) {
  const { error } = await supabase
    .from("campaign_forms")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
