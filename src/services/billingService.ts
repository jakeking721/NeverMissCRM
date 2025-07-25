// src/services/billingService.ts
// ------------------------------------------------------------------------------------
// billingService: thin wrapper around creditsService for future Stripe integration.
// In the real backend, this service would:
// - create checkout sessions
// - listen to webhooks
// - reconcile user balances
// ------------------------------------------------------------------------------------

import { creditsService } from "./creditsService";

export type PurchaseResult = {
  ok: boolean;
  checkoutUrl?: string;
  message?: string;
};

export async function beginPurchase(amount: number): Promise<PurchaseResult> {
  // For now just call the local creditsService stub.
  const res = await creditsService.beginUserPurchase(amount);
  return {
    ok: !!res.ok,
    checkoutUrl: (res as any).checkoutUrl,
    message: (res as any).message,
  };
}
