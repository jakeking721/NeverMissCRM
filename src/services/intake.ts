import { supabase } from "@/utils/supabaseClient";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

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
  const userId = await requireUserId();
  const { data, error } = await supabase.rpc("intake_add_customer", {
    p_slug: slug,
    p_name: name,
    p_phone: phone,
    p_location: location ?? null,
    p_extra: extra ?? null,
    p_user_id: userId,
  });
  if (error) throw error;
  return data as string;
}
