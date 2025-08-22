import { supabase } from "@/utils/supabaseClient";

export interface IntakeCampaign {
  id: string;
  title: string;
  slug: string;
  form_version_id: string;
  form_snapshot_json: any | null;
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
      "id, title, slug, form_version_id, form_snapshot_json, start_date, end_date, status, gate_field, prefill_gate, success_message, require_consent"
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as IntakeCampaign[]) || [];
}

export async function getIntakeCampaign(id: string): Promise<IntakeCampaign | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("intake_campaigns")
    .select(
      "id, title, slug, form_version_id, form_snapshot_json, start_date, end_date, status, gate_field, prefill_gate, success_message, require_consent"
    )
    .eq("id", id)
    .eq("owner_id", userId)
    .single();
  if (error) throw error;
  return (data as IntakeCampaign) ?? null;
}

export async function createIntakeCampaign(payload: {
  title: string;
  slug: string;
  form_version_id: string;
  form_snapshot_json?: any | null;
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

export async function updateIntakeCampaign(
  id: string,
  payload: {
    title: string;
    slug: string;
    form_version_id: string;
    form_snapshot_json?: any | null;
    start_date?: string | null;
    end_date?: string | null;
    gate_field: "phone" | "email";
    prefill_gate?: boolean;
    success_message?: string | null;
    require_consent?: boolean;
  },
): Promise<IntakeCampaign> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("intake_campaigns")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as IntakeCampaign;
}
