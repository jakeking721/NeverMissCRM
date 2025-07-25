// src/utils/roles.ts
// -----------------------------------------------------------------------------
// Centralized role helpers (Supabase-first).
// Defaults to "user" when role is absent (back-compat).
// -----------------------------------------------------------------------------

import { User } from "@/utils/auth";

export type Role = "admin" | "user";

export const ROLES: Role[] = ["user", "admin"];

export function getRole(user: User | null | undefined): Role {
  if (!user) return "user";
  if (user.role === "admin") return "admin";

  // TEMP back-compat: if some legacy users don't have role set yet.
  if (!user.role && user.username?.toLowerCase?.() === "admin") return "admin";

  return "user";
}

export function isAdmin(user: User | null | undefined): boolean {
  return getRole(user) === "admin";
}

export function hasRole(user: User | null | undefined, role: Role): boolean {
  return getRole(user) === role;
}

/** Throw if not admin (useful in actions/services). */
export function assertAdmin(user: User | null | undefined) {
  if (!isAdmin(user)) throw new Error("Admin only");
}
