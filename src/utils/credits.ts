// src/utils/credits.ts
// ------------------------------------------------------------------------------------
// Central credit helpers used by both legacy code and the new services layer.
// This file intentionally provides BOTH the new names (getCredits, addCredits,
// deductCredits) and the old helpers (getSmsCost, getUserCredits) so nothing breaks.
// ------------------------------------------------------------------------------------

import { getCurrentUser, saveCurrentUser, User } from "./auth";

// Cost per SMS segment (very naive 160-char rule).
export const DEFAULT_SMS_COST_PER_SEGMENT = 1;

// --------------------------- Public API (new) ---------------------------

/** Get the current (or provided) user's credits. */
export function getCredits(user?: User | null): number {
  const u = user ?? getCurrentUser();
  return u?.credits ?? 0;
}

/** Add credits to the given (or current) user. */
export function addCredits(user: User | null | undefined, amount: number): void {
  if (!user) return;
  user.credits = (user.credits ?? 0) + Math.max(0, amount);
  saveCurrentUser(user);
}

/** Deduct credits from the given (or current) user. Returns true if success. */
export function deductCredits(user: User | null | undefined, amount: number): boolean {
  if (!user) return false;
  const current = user.credits ?? 0;
  const amt = Math.max(0, amount);
  if (current < amt) return false;
  user.credits = current - amt;
  saveCurrentUser(user);
  return true;
}

/** Can the current user afford `amount` credits? */
export function canAfford(amount: number): boolean {
  return getCredits() >= amount;
}

/** Estimate credits for a message + recipient count (naive 160-char segments). */
export function estimateCreditsForMessage(
  message: string,
  recipients: number,
  costPerSegment: number = DEFAULT_SMS_COST_PER_SEGMENT
): number {
  const segments = Math.max(1, Math.ceil((message ?? "").length / 160));
  return segments * Math.max(0, recipients) * costPerSegment;
}

// --------------------------- Legacy compatibility ---------------------------

/**
 * Legacy helper your old SmsModal used.
 * Keep returning the cost per segment so old code still works.
 */
export function getSmsCost(): number {
  return DEFAULT_SMS_COST_PER_SEGMENT;
}

/**
 * Legacy helper your old SmsModal used.
 * It sometimes passed a stringified user from localStorage, so we support both.
 */
export function getUserCredits(arg?: string | User | null): number {
  if (!arg) return getCredits();
  if (typeof arg === "string") {
    try {
      const parsed = JSON.parse(arg);
      return Number(parsed?.credits ?? 0);
    } catch {
      // fallback to current user if parsing fails
      return getCredits();
    }
  }
  return Number(arg.credits ?? 0);
}
