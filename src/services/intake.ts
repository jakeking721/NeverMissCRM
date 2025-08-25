import { supabase } from "@/utils/supabaseClient";
import { normalizePhone } from "@/utils/phone";
import { normalizeEmail } from "@/utils/email";

export interface IntakeParams {
  formId: string;
  campaignId?: string;
  userId: string;
  answers: Record<string, any>;
  consentText?: string | null;
}

export async function submitIntake({
  formId,
  campaignId,
  userId,
  answers,
  consentText,
}: IntakeParams): Promise<string> {
  const filtered: Record<string, any> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    filtered[k] = v;
  }

  const transformed: Record<string, any> = {};
  for (const [k, v] of Object.entries(filtered)) {
    if (k === "f.phone") transformed[k] = normalizePhone(v);
    else if (k === "f.email") transformed[k] = normalizeEmail(v);
    else if (k === "f.zip_code") transformed[k] = String(v).trim();
    else if (k.startsWith("r.")) {
      transformed[k.slice(2)] = v;
    } else {
      transformed[k] = v;
    }
  }

  const { data, error } = await supabase.rpc("intake_submit", {
    p_user_id: userId,
    p_form_id: formId,
    p_campaign_id: campaignId ?? null,
    p_answers: transformed,
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
  userId: string;
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
    userId: data.owner_id,
    gateField: (data.gate_field as "phone" | "email") || "phone",
    prefill: data.prefill_gate ?? false,
    successMessage: data.success_message ?? null,
    requireConsent: data.require_consent ?? false,
  };
}