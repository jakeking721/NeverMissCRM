import { supabase } from "@/utils/supabaseClient";

export interface IntakeCampaign {
  id: string;
  title: string;
  slug: string;
  form_id: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  gate_field: "phone" | "email";
  prefill_gate: boolean;
  success_message: string | null;
  require_consent: boolean;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function getIntakeCampaigns(): Promise<IntakeCampaign[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("intake_campaigns")
    .select(
      "id, title, slug, form_id, start_date, end_date, status, gate_field, prefill_gate, success_message, require_consent",
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createIntakeCampaign(payload: {
  title: string;
  slug: string;
  form_id: string;
  start_date?: string | null;
  end_date?: string | null;
  gate_field: "phone" | "email";
  prefill_gate?: boolean;
  success_message?: string | null;
  require_consent?: boolean;
}): Promise<IntakeCampaign> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("intake_campaigns")
    .insert({ owner_id: userId, status: "draft", ...payload })
    .select()
    .single();
  if (error) throw error;
  return data as IntakeCampaign;
}
