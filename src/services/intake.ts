import { supabase } from "@/utils/supabaseClient";

export async function submitIntake(payload: Record<string, any>): Promise<string> {
  const { data, error } = await supabase.rpc("intake_add_customer", { payload });
  if (error) throw error;
  return data as string;
}
