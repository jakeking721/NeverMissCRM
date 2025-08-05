// src/services/campaignService.ts
// ------------------------------------------------------------------------------------
// Campaign data service (Supabase-backed)
// - Replaces the old localStorage implementation
// - Function names kept the same, but **all are async now**
// ------------------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";
import { getCurrentUser } from "@/utils/auth";

export type Campaign = {
  id: string;
  name: string;
  message: string;
  recipients: string[];
  status: "draft" | "scheduled" | "sent";
  createdAt: string; // ISO
  scheduledFor?: string; // ISO | undefined
};

function requireUserId(): string {
  const me = getCurrentUser();
  if (!me?.id) {
    throw new Error("Not authenticated");
  }
  return me.id;
}

function rowToCampaign(row: any): Campaign {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    recipients: (row.recipients ?? []) as string[],
    status: row.status,
    createdAt: row.created_at,
    scheduledFor: row.scheduled_for ?? undefined,
  };
}

/**
 * Get all campaigns (newest first).
 */
export async function getCampaigns(): Promise<Campaign[]> {
  const userId = requireUserId();

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, user_id, name, message, recipients, status, created_at, scheduled_for")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(rowToCampaign);
}

/**
 * Insert a campaign.
 */
export async function addCampaign(c: Campaign): Promise<void> {
  const userId = requireUserId();

  const payload = {
    id: c.id,
    user_id: userId,
    name: c.name,
    message: c.message,
    recipients: c.recipients ?? [],
    status: c.status,
    created_at: c.createdAt ?? new Date().toISOString(),
    scheduled_for: c.scheduledFor ?? null,
  };

  const { error } = await supabase.from("campaigns").insert(payload);
  if (error) throw error;
}

/**
 * Delete a campaign by id.
 */
export async function removeCampaign(id: string): Promise<void> {
  const userId = requireUserId();
  const { error } = await supabase.from("campaigns").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

/**
 * Update status for a campaign you own.
 */
export async function updateCampaignStatus(id: string, status: Campaign["status"]): Promise<void> {
  const userId = requireUserId();
  const { error } = await supabase
    .from("campaigns")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Mark any due scheduled campaigns as sent (client-side helper).
 * NOTE: In production, do this on the server or via a scheduled job.
 * Returns the updated list (after mutation).
 */
export async function markSentIfDue(): Promise<Campaign[]> {
  const userId = requireUserId();

  const nowIso = new Date().toISOString();

  // Update all that are due
  const { error: updErr } = await supabase
    .from("campaigns")
    .update({ status: "sent" })
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .lte("scheduled_for", nowIso);

  if (updErr) throw updErr;

  // Return the fresh list
  return getCampaigns();
}
