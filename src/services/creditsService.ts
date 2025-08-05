// src/services/creditsService.ts
// ------------------------------------------------------------------------------------
// Supabase-backed credit management
// - All balances are read/written on profiles.credits
// - All functions are async now (DB-backed) — update callers to await.
// - Admin-only mutations check profile.role === 'admin'.
// - Uses Postgres RPC increment_credits for atomic updates when available.
// ------------------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";

type ServiceResult<T = void> = { ok: boolean; message?: string; data?: T };

export interface CreditsService {
  getBalance: () => Promise<number>;
  canAfford: (amount: number) => Promise<boolean>;
  deduct: (amount: number) => Promise<ServiceResult>;
  adminAddToCurrentUser: (amount: number) => Promise<ServiceResult>;
  adminAddToUser: (userId: string, amount: number) => Promise<ServiceResult>;
  beginUserPurchase: (amount: number) => Promise<ServiceResult<{ checkoutUrl?: string }>>;
  getUserBalance: (userId: string) => Promise<number>;
}

async function getSessionUser() {
  if (import.meta.env.VITEST) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

async function getMyProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw error;
  return data;
}

async function getProfileById(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

async function setCredits(userId: string, nextCredits: number) {
  const { error } = await supabase
    .from("profiles")
    .update({ credits: nextCredits })
    .eq("id", userId);
  if (error) throw error;
}

async function incrementCredits(userId: string, delta: number) {
  const { error } = await supabase.rpc("increment_credits", {
    p_user_id: userId,
    p_amount: delta,
  });
  if (error) throw error;
}

export function createCreditsService(): CreditsService {
  return {
    async getBalance(): Promise<number> {
      const me = await getMyProfile();
      if (!me) return 0;
      return me.credits ?? 0;
    },

    async canAfford(amount: number): Promise<boolean> {
      const balance = await this.getBalance();
      return balance >= amount;
    },

    async deduct(amount: number): Promise<ServiceResult> {
      try {
        const user = await getSessionUser();
        if (!user) return { ok: false, message: "Not logged in." };

        const me = await getProfileById(user.id);
        const current = me.credits ?? 0;
        if (current < amount) {
          return { ok: false, message: "Insufficient credits." };
        }

        try {
          await incrementCredits(user.id, -amount);
        } catch {
          await setCredits(user.id, current - amount);
        }
        return { ok: true };
      } catch (e: any) {
        console.error(e);
        return { ok: false, message: e.message ?? "Failed to deduct credits." };
      }
    },

    async adminAddToCurrentUser(amount: number): Promise<ServiceResult> {
      try {
        const me = await getMyProfile();
        if (!me) return { ok: false, message: "Not logged in." };
        if (me.role !== "admin") {
          return { ok: false, message: "Only admins can add credits directly." };
        }

        try {
          await incrementCredits(me.id, amount);
        } catch {
          const current = me.credits ?? 0;
          await setCredits(me.id, current + amount);
        }
        return { ok: true };
      } catch (e: any) {
        console.error(e);
        return { ok: false, message: e.message ?? "Failed to add credits." };
      }
    },

    async adminAddToUser(userId: string, amount: number): Promise<ServiceResult> {
      try {
        const me = await getMyProfile();
        if (!me) return { ok: false, message: "Not logged in." };
        if (me.role !== "admin") {
          return { ok: false, message: "Only admins can add credits directly." };
        }

        try {
          await incrementCredits(userId, amount);
        } catch {
          const userProfile = await getProfileById(userId);
          const current = userProfile.credits ?? 0;
          await setCredits(userId, current + amount);
        }
        return { ok: true };
      } catch (e: any) {
        console.error(e);
        return { ok: false, message: e.message ?? "Failed to add credits to user." };
      }
    },

    async beginUserPurchase(amount: number): Promise<ServiceResult<{ checkoutUrl?: string }>> {
      // For now, simulate a top-up to the current user. Replace with Stripe Checkout session / Payment link in production.
      try {
        const user = await getSessionUser();
        if (!user) return { ok: false, message: "Not logged in." };

        const me = await getProfileById(user.id);
        const current = me.credits ?? 0;
        await setCredits(user.id, current + amount);

        return {
          ok: true,
          message: "Simulated purchase complete.",
          data: { checkoutUrl: undefined },
        };
      } catch (e: any) {
        console.error(e);
        return { ok: false, message: e.message ?? "Failed to purchase credits." };
      }
    },

    async getUserBalance(userId: string): Promise<number> {
      try {
        const me = await getMyProfile();
        if (!me || me.role !== "admin") return 0; // or throw

        const profile = await getProfileById(userId);
        return profile.credits ?? 0;
      } catch (e) {
        console.error(e);
        return 0;
      }
    },
  };
}

export const creditsService = createCreditsService();
