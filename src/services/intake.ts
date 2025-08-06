import { supabase } from "@/utils/supabaseClient";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function submitIntake(payload: Record<string, any>): Promise<string> {
  const userId = await requireUserId();
  const withUser = { ...payload, user_id: userId };
  const { data, error } = await supabase.rpc("intake_add_customer", { payload: withUser });
  if (error) throw error;
  return data as string;
}
