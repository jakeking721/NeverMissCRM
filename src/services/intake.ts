import { supabase } from "@/utils/supabaseClient";
import { normalizePhone } from "@/utils/phone";
import { normalizeEmail } from "@/utils/email";

export interface IntakeParams {
  campaignId: string;
  formVersionId: string;
  ownerId: string;
  answers: Record<string, any>;
  consentText?: string | null;
}

export async function submitIntake({
  campaignId,
  formVersionId,
  ownerId,
  answers,
  consentText,
}: IntakeParams): Promise<string> {
  const filtered: Record<string, any> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "boolean" && v === false) continue;
    filtered[k] = v;
  }

  if (filtered["f.phone"]) filtered["f.phone"] = normalizePhone(filtered["f.phone"]);
  if (filtered["f.email"]) filtered["f.email"] = normalizeEmail(filtered["f.email"]);
  if (filtered["f.zip_code"]) filtered["f.zip_code"] = String(filtered["f.zip_code"]).trim();

  const { data, error } = await supabase.rpc("intake_submit", {
    p_user_id: ownerId,
    p_campaign_id: campaignId,
    p_form_version_id: formVersionId,
    p_answers: filtered,
    p_consent_text: consentText ?? null,
  });

  if (error || !data) {
    throw error || new Error("Failed to submit intake");
  }

  return data as string;
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