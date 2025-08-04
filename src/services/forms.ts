import { supabase } from "@/utils/supabaseClient";

export async function fetchForms() {
  const { data, error } = await supabase.from("campaign_forms").select("*");
  if (error) throw error;
  return data;
}

export async function fetchForm(id: string) {
  const { data, error } = await supabase
    .from("campaign_forms")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function saveForm(payload: any) {
  const { data, error } = await supabase
    .from("campaign_forms")
    .upsert(payload)
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
