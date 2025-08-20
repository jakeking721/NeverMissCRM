// src/utils/roles.ts
// -----------------------------------------------------------------------------
// Role and profile helpers.
// -----------------------------------------------------------------------------

export type Role = "admin" | "user";

export type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  role: Role;
  credits: number;
  avatar: string | null;
  is_approved: boolean;
  is_active: boolean;
  deactivated_at?: string | null;
};

export const isAdmin = (profile?: Profile | null) => profile?.role === "admin";

export function hasRole(profile: Profile | null | undefined, role: Role) {
  return profile?.role === role;
}

export function assertAdmin(profile: Profile | null | undefined) {
  if (!isAdmin(profile)) throw new Error("Admin only");
}
