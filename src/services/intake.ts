import { supabase } from "@/utils/supabaseClient";
import { normalizePhone } from "@/utils/phone";

export interface IntakeParams {
  slug: string;
  campaignId: string;
  formVersionId: string;
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
  formVersionId,
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

// Check if this phone already exists for this owner (short-circuit if so)
const { data: existing } = await supabase.rpc("intake_find_customer", {
  owner_id: ownerId,
  gate: "phone",
  value: normalizePhone(phone),
});
if (existing) {
  return "already";
}

// Submit intake + attach customer in one server-side step (RPC)
const { data: customerId, error } = await supabase.rpc("intake_submit_attach", {
  p_campaign_id: campaignId,
  p_form_version_id: formVersionId,
  p_payload_json: payload,            // { firstName, lastName, phone, zipCode, extra }
  p_slug: slug,
  p_first_name: firstName,
  p_last_name: lastName,
  p_phone: normalizePhone(phone),
  p_zip_code: zipCode ?? null,
  p_extra: extra ?? null,
  p_user_id: ownerId,
});

if (error || !customerId) {
  throw error || new Error("Failed to submit intake with customer");
}

return customerId as string;
}

export interface WizardConfig {
  campaignId: string;
  formVersionId: string;
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
      "campaign_id, owner_id, form_version_id, gate_field, prefill_gate, success_message, require_consent"
    )
    .eq("slug", slug)
    .single();
  if (error || !data) throw error || new Error("Campaign not found");
  return {
    campaignId: data.campaign_id,
    formVersionId: data.form_version_id,
    ownerId: data.owner_id,
    gateField: (data.gate_field as "phone" | "email") || "phone",
    prefill: data.prefill_gate ?? false,
    successMessage: data.success_message ?? null,
    requireConsent: data.require_consent ?? false,
  };
}