// src/utils/auth.ts
// -----------------------------------------------------------------------------
// Supabase-backed authentication helpers (no localStorage fallbacks)
// - Provides thin wrappers around Supabase auth and profile operations
// - Exports types reused across the app
// -----------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";

export type Role = "admin" | "user";

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  signupDate: string;
  [key: string]: any;
};

export type User = {
  id: string;
  username?: string | null;
  email?: string | null;
  credits?: number;
  role?: Role;
  avatar?: string | null;
};

// -----------------------------------------------------------------------------
// Auth actions
// -----------------------------------------------------------------------------

export async function registerUser({
  email,
  password,
  username,
}: {
  email: string;
  password: string;
  username?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) return { ok: false, message: error.message };

  const userId = data?.user?.id;
  if (userId) {
    await supabase.from("profiles").upsert(
      {
        id: userId,
        username,
        role: "user",
        credits: 0,
        avatar: "",
        public_slug: null,
      },
      { onConflict: "id" }
    );
  }

  return { ok: true };
}

export async function loginUser({
  usernameOrEmail,
  password,
}: {
  usernameOrEmail: string;
  password: string;
}): Promise<{ ok: boolean; message?: string }> {
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameOrEmail,
    password,
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}

// -----------------------------------------------------------------------------
// Profiles
// -----------------------------------------------------------------------------

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error || !data) return [];
  return data.map((p: any) => ({
    id: p.id,
    username: p.username,
    email: null,
    role: p.role as Role,
    credits: p.credits,
    avatar: p.avatar,
  }));
}

export async function saveCurrentUser(next: Partial<User>): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const me = data.user;
  if (!me) return;

  const patch: Record<string, any> = {};
  if (next.username !== undefined) patch.username = next.username;
  if (next.avatar !== undefined) patch.avatar = next.avatar;
  if (next.credits !== undefined) patch.credits = next.credits;
  if (next.role !== undefined) patch.role = next.role;

  if (Object.keys(patch).length === 0) return;
  await supabase.from("profiles").update(patch).eq("id", me.id);
}

