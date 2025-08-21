import { supabase } from "@/utils/supabaseClient";
import { normalizePhone } from "@/utils/phone";

export interface IntakeParams {
  slug: string;
  firstName: string;
  lastName: string;
  phone: string;
  zipCode?: string | null;
  extra?: Record<string, any> | null;
}

export async function submitIntake({
  slug,
  firstName,
  lastName,
  phone,
  zipCode,
  extra,
}: IntakeParams): Promise<string> {
  const { data: slugRow, error: slugErr } = await supabase
    .from("public_slugs")
    .select("user_id")
    .eq("slug", slug)
    .single();
  if (slugErr || !slugRow) throw slugErr || new Error("Invalid slug");

  const { data, error } = await supabase.rpc("intake_add_customer", {
    p_slug: slug,
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: normalizePhone(phone),
    p_zip_code: zipCode ?? null,
    p_extra: extra ?? null,
    p_user_id: slugRow.user_id,
  });
  if (error) throw error;
  return data as string;
}

export interface WizardConfig {
  campaignId: string;
  ownerId: string;
  formSlug: string;
  gateField: "phone" | "email";
  prefill: boolean;
  successMessage: string | null;
  requireConsent: boolean;
}

export async function fetchWizardConfig(slug: string): Promise<WizardConfig> {
  const { data, error } = await supabase
    .from("intake_campaigns")
    .select(
      "id, owner_id, gate_field, prefill_gate, success_message, require_consent, campaign_forms!inner(slug)"
    )
    .eq("slug", slug)
    .single();
  if (error || !data) throw error || new Error("Campaign not found");
  return {
    campaignId: data.id,
    ownerId: data.owner_id,
    formSlug: data.campaign_forms?.[0]?.slug ?? "",
    gateField: (data.gate_field as "phone" | "email") || "phone",
    prefill: data.prefill_gate ?? false,
    successMessage: data.success_message ?? null,
    requireConsent: data.require_consent ?? false,
  };
}

