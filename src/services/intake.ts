import { supabase } from "@/utils/supabaseClient";
import { normalizePhone } from "@/utils/phone";

export interface IntakeParams {
  slug: string;
  name: string;
  phone: string;
  location?: string | null;
  extra?: Record<string, any> | null;
}

export async function submitIntake({
  slug,
  name,
  phone,
  location,
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
    p_name: name,
    p_phone: normalizePhone(phone),
    p_location: location ?? null,
    p_extra: extra ?? null,
    p_user_id: slugRow.user_id,
  });
  if (error) throw error;
  return data as string;
}
