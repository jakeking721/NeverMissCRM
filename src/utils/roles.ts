// src/utils/roles.ts
// -----------------------------------------------------------------------------
// Centralized role helpers (Supabase-first).
// Defaults to "user" when role is absent (back-compat).
// -----------------------------------------------------------------------------

export type Role = "admin" | "user";

export const ROLES: Role[] = ["user", "admin"];

type UserLike = { role?: Role; username?: string | null } | null | undefined;

export function getRole(user: UserLike): Role {
  if (!user) return "user";
  if (user.role === "admin") return "admin";

  // TEMP back-compat: if some legacy users don't have role set yet.
  if (!user.role && user.username?.toLowerCase?.() === "admin") return "admin";

  return "user";
}

export function isAdmin(user: UserLike): boolean {
  return getRole(user) === "admin";
}

export function hasRole(user: UserLike, role: Role): boolean {
  return getRole(user) === role;
}

/** Throw if not admin (useful in actions/services). */
export function assertAdmin(user: UserLike) {
  if (!isAdmin(user)) throw new Error("Admin only");
}
