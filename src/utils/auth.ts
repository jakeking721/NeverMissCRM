// src/utils/auth.ts
// ------------------------------------------------------------------------------------
// Supabase-backed authentication + profile cache
// - Replaces the localStorage-only demo auth
// - Still exposes the same function names so the rest of the app compiles
// - getCurrentUser() stays synchronous by reading a cache (localStorage) so
//   ProtectedRoute / legacy code keeps working.
// - Use refreshCurrentUser() after login/register to sync the cache.
// ------------------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";

export type Role = "admin" | "user";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  location?: string;
  signupDate: string;
  [key: string]: any; // custom fields
};

export type User = {
  id: string;
  username?: string | null;
  email?: string | null;
  credits?: number;
  role?: Role;
  avatar?: string | null;
};

const PROFILE_CACHE_KEY = "nevermiss_supabase_profile";

// -------------------------- Cache helpers (keep sync API) --------------------------

function readProfileCache(): User | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeProfileCache(user: User | null) {
  if (!user) {
    localStorage.removeItem(PROFILE_CACHE_KEY);
    return;
  }
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(user));
}

// -------------------------- Public API (kept for compatibility) --------------------------

/**
 * **SYNC** – returns the last cached profile (or null).
 * Call `refreshCurrentUser()` to force-refresh from Supabase.
 */
export function getCurrentUser(): User | null {
  return readProfileCache();
}

/**
 * **ASYNC** – reads the authed Supabase user + its profile row,
 * then updates the local cache used by getCurrentUser().
 */
export async function refreshCurrentUser(): Promise<User | null> {
  if (process.env.VITEST) {
    writeProfileCache(null);
    return null;
  }
  try {
    const { data: auth } = await supabase.auth.getUser();
    const sUser = auth.user;
    if (!sUser) {
      writeProfileCache(null);
      return null;
    }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sUser.id)
    .single();

  if (error || !profile) {
    writeProfileCache(null);
    return null;
  }

  const u: User = {
    id: sUser.id,
    username: profile.username,
    email: sUser.email,
    role: (profile.role as Role) ?? "user",
    credits: profile.credits ?? 0,
    avatar: profile.avatar ?? null,
  };

  writeProfileCache(u);
  return u;
  } catch {
    writeProfileCache(null);
    return null;
  }
}

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
    options: {
      data: { username },
    },
  });
  if (error) return { ok: false, message: error.message };

  // If you have confirm-email turned on, there's no session yet. We just stop here.
  if (data?.user && !data.session) {
    // rely on DB trigger handle_new_user() to create the row; if not present, it will be created after first login (refreshCurrentUser will fail until then)
    return { ok: true };
  }

  // If we're already logged-in right after signUp (email confirmations off),
  // refresh the cache.
  await refreshCurrentUser();
  return { ok: true };
}

/**
 * NOTE: For now, **login is by email**. Your existing UI that accepts username/email
 * will still work, but you must enter the email. (We can add username login later
 * with a public lookup view / RPC.)
 */
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

  await refreshCurrentUser();
  return { ok: true };
}

export async function logoutUser() {
  await supabase.auth.signOut();
  writeProfileCache(null);
}

/**
 * Admin helper – fetch all users (requires an admin RLS policy in SQL).
 * If you didn't add that policy yet, this will return only the current user's row.
 */
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error || !data) return [];
  return data.map((p: any) => ({
    id: p.id,
    username: p.username,
    email: null, // client RPC can't join auth.users directly; do it in a server function if needed
    role: p.role as Role,
    credits: p.credits,
    avatar: p.avatar,
  }));
}

/**
 * Update profile fields (credits, avatar, username, etc.) for current user.
 * WARNING: RLS/Policies should block non-admins from changing role/credits directly.
 */
export async function saveCurrentUser(next: Partial<User>): Promise<void> {
  const me = readProfileCache();
  if (!me) return;

  const patch: Record<string, any> = {
    username: next.username ?? me.username,
    avatar: next.avatar ?? me.avatar,
  };

  // Optional: if your policy allows, you can let users update their own credits/role
  if (next.credits !== undefined) patch.credits = next.credits;
  if (next.role !== undefined) patch.role = next.role;

  await supabase.from("profiles").update(patch).eq("id", me.id);
  await refreshCurrentUser();
}

/** Legacy alias some old files might still import. */
export function updateCurrentUser(next: User) {
  // keep a warning to remind you this is now async on the backend
  // but we just write to cache so legacy code compiles; call saveCurrentUser for real updates
  console.warn(
    "updateCurrentUser is deprecated in Supabase mode; use saveCurrentUser (async) instead."
  );
  writeProfileCache(next);
}

// -------------------------- Legacy compatibility (customer intake, etc.) --------------------------

/**
 * For Supabase, DON'T use this function for public QR intake.
 * Instead, call the RPC we created (intake_add_customer) with a public slug.
 * Keeping the stub so the app compiles; you can remove when intake is migrated.
 */
export function addCustomerToUserByIdentifier(_identifier: string, _customer: Customer): boolean {
  console.warn(
    "addCustomerToUserByIdentifier: This localStorage-era helper is deprecated. " +
      "Use the Supabase RPC (intake_add_customer) with a public slug instead."
  );
  return false;
}

/**
 * Also deprecated in Supabase mode – to lookup users by username/email publicly,
 * expose a view / policy or use a slug table + RPC. Keeping the stub for compile.
 */
export function findUserByEmailOrUsername(_identifier: string): User | null {
  console.warn(
    "findUserByEmailOrUsername: Deprecated in Supabase mode. Use a slug/RPC-based lookup."
  );
  return null;
}

// -------------------------- Bootstrap: keep cache in sync on tab changes --------------------------

/**
 * Optional: call this once in main.tsx to keep the cache updated on auth state changes.
 */
export function bootstrapAuthCacheListener() {
  const { data } = supabase.auth.onAuthStateChange(async () => {
    await refreshCurrentUser();
  });
  return () => data.subscription.unsubscribe();
}
