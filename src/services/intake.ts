import { supabase } from "@/utils/supabaseClient";
import { normalizePhone } from "@/utils/phone";

export interface IntakeParams {
  slug: string;
  campaignId: string;
  ownerId: string;
  firstName: string;
  lastName: string;
  phone: string;
  zipCode?: string | null;
  extra?: Record<string, any> | null;
}

export async function submitIntake({
  slug,
  campaignId,
  ownerId,
  firstName,
  lastName,
  phone,
  zipCode,
  extra,
}: IntakeParams): Promise<string> {
  const payload = {
    firstName,
    lastName,
    phone,
    zipCode: zipCode ?? null,
    extra: extra ?? null,
  };

  const { data: submission, error: subErr } = await supabase
    .from("intake_submissions")
    .insert({ campaign_id: campaignId, payload_json: payload })
    .select("id")
    .single();
  if (subErr || !submission) throw subErr || new Error("Failed to log submission");

  const { data, error } = await supabase.rpc("intake_add_customer", {
    p_slug: slug,
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: normalizePhone(phone),
    p_zip_code: zipCode ?? null,
    p_extra: extra ?? null,
    p_user_id: ownerId,
  });
  if (error) throw error;

  await supabase
    .from("intake_submissions")
    .update({ customer_id: data as string })
    .eq("id", submission.id);

  return data as string;
}

export interface WizardConfig {
  campaignId: string;
  ownerId: string;
  gateField: "phone" | "email";
  prefill: boolean;
  successMessage: string | null;
  requireConsent: boolean;
}

export async function fetchWizardConfig(slug: string): Promise<WizardConfig> {
  const { data, error } = await supabase
    .from("intake_resolver")
    .select(
      "campaign_id, owner_id, gate_field, prefill_gate, success_message, require_consent"
    )
    .eq("slug", slug)
    .single();
  if (error || !data) throw error || new Error("Campaign not found");
  return {
    campaignId: data.campaign_id,
    ownerId: data.owner_id,
    gateField: (data.gate_field as "phone" | "email") || "phone",
    prefill: data.prefill_gate ?? false,
    successMessage: data.success_message ?? null,
    requireConsent: data.require_consent ?? false,
  };
}

