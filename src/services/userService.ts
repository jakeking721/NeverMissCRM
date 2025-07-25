// src/services/userService.ts
// ------------------------------------------------------------------------------------
// Supabase-backed user registry for the Admin panel.
// - Replaces the old localStorage shim completely.
// - All functions are now **async**.
// - Requires admin-capable RLS / policies to read & update other users.
// - If you haven't added those policies yet, you'll only see your own profile.
// ------------------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";
import type { User, Role } from "@/utils/auth";

type ServiceResult<T = void> = { ok: boolean; message?: string; data?: T };

/**
 * Fetch all users (profiles table).
 * NOTE: You must grant admins permission to select all profiles (RLS / policy),
 * otherwise this will only return the current user's row.
 */
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error || !data) return [];
  return data.map((p: any) => ({
    id: p.id,
    username: p.username,
    email: null, // You can't join auth.users from the client safely; do it via serverless/RPC if needed
    role: (p.role as Role) ?? "user",
    credits: p.credits ?? 0,
    avatar: p.avatar ?? null,
  }));
}

/**
 * Upsert a user’s profile fields (admin use).
 * Only updates columns we explicitly allow: username, role, credits, avatar.
 * You can expand this safely behind your RLS policies.
 */
export async function upsertUser(
  user: Partial<User> & { id: string }
): Promise<ServiceResult<User>> {
  try {
    const patch: Record<string, any> = {};
    if (user.username !== undefined) patch.username = user.username;
    if (user.role !== undefined) patch.role = user.role;
    if (user.credits !== undefined) patch.credits = user.credits;
    if (user.avatar !== undefined) patch.avatar = user.avatar;

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) throw error;

    const result: User = {
      id: data.id,
      username: data.username,
      email: null,
      role: data.role as Role,
      credits: data.credits ?? 0,
      avatar: data.avatar ?? null,
    };

    return { ok: true, data: result };
  } catch (e: any) {
    console.error(e);
    return { ok: false, message: e.message ?? "Failed to update user." };
  }
}

/**
 * Admin: Add credits to a specific user.
 * Prefer doing this through an RPC for atomicity (increment_credits or add_credits).
 */
export async function adminAddCreditsToUser(
  userId: string,
  amount: number
): Promise<ServiceResult> {
  try {
    // If you created the recommended RPC:
    // const { error } = await supabase.rpc("increment_credits", { p_user_id: userId, p_amount: amount });
    // If you only have add_credits (wrapper) use that:
    const { error } = await supabase.rpc("add_credits", {
      p_user_id: userId,
      p_amount: amount,
    });
    if (error) throw error;
    return { ok: true };
  } catch (e: any) {
    console.error(e);
    return { ok: false, message: e.message ?? "Failed to add credits." };
  }
}

/**
 * Get a single user's current credit balance (admin).
 */
export async function getUserCreditsFor(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data?.credits ?? 0;
  } catch (e) {
    console.error(e);
    return 0;
  }
}
