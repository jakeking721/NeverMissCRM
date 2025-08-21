// src/services/campaignService.ts
// ------------------------------------------------------------------------------------
// Campaign data service (Supabase-backed)
// - Replaces the old localStorage implementation
// - Function names kept the same, but **all are async now**
// ------------------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";

// Campaign type now supports both SMS and intake flows
export type Campaign = {
  id: string;
  title?: string; // new field, replaces name
  name?: string; // legacy support
  slug?: string;
  formTemplateId?: string;
  formSnapshotJson?: any;
  type?: "sms" | "intake";
  message?: string;
  recipients?: string[];
  status: "draft" | "scheduled" | "sent";
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  startAt?: string; // ISO
  endAt?: string; // ISO
  scheduledFor?: string; // legacy alias for startAt
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Not authenticated");
  }
  return data.user.id;
}

function rowToCampaign(row: any): Campaign {
  return {
    id: row.id,
    title: row.title ?? row.name,
    name: row.name, // legacy field for backward compatibility
    slug: row.slug,
    formTemplateId: row.form_template_id ?? undefined,
    formSnapshotJson: row.form_snapshot_json ?? undefined,
    type: row.type,
    message: row.message,
    recipients: (row.recipients ?? []) as string[],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    startAt: row.start_at ?? row.scheduled_for ?? undefined,
    endAt: row.end_at ?? undefined,
    scheduledFor: row.start_at ?? row.scheduled_for ?? undefined,
  };
}

async function ensureUniqueSlug(slug: string | undefined, userId: string, excludeId?: string) {
  if (!slug) return;
  let query = supabase.from("campaigns").select("id").eq("owner_id", userId).eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw error;
  if (data && data.length > 0) throw new Error("Slug already in use");
}

async function fetchFormSnapshot(userId: string, formId: string | undefined) {
  if (!formId) return null;
  const { data, error } = await supabase
    .from("forms")
    .select("schema_json")
    .eq("id", formId)
    .eq("owner_id", userId)
    .single();
  if (error) throw error;
  return data?.schema_json ?? null;
}

/**
 * Get all campaigns (newest first).
 */
export async function getCampaigns(): Promise<Campaign[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, owner_id, title, name, slug, type, message, recipients, status, created_at, updated_at, start_at, end_at, form_template_id, form_snapshot_json"
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(rowToCampaign);
}

/**
 * Insert a campaign.
 */
export async function addCampaign(c: Campaign): Promise<void> {
  const userId = await requireUserId();

  await ensureUniqueSlug(c.slug, userId);
  const snapshot = await fetchFormSnapshot(userId, c.formTemplateId);

  const payload = {
    id: c.id,
    owner_id: userId,
    title: c.title ?? c.name,
    name: c.name, // legacy field if still used
    slug: c.slug,
    type: c.type ?? "sms",
    message: c.message,
    recipients: c.recipients ?? [],
    status: c.status,
    created_at: c.createdAt ?? new Date().toISOString(),
    updated_at: c.updatedAt ?? new Date().toISOString(),
    start_at: c.startAt ?? c.scheduledFor ?? null,
    end_at: c.endAt ?? null,
    form_template_id: c.formTemplateId ?? null,
    form_snapshot_json: snapshot,
  };

  const { error } = await supabase.from("campaigns").insert(payload);
  if (error) throw error;
}

/**
 * Update a campaign you own.
 */
export async function updateCampaign(c: Campaign): Promise<void> {
  const userId = await requireUserId();
  await ensureUniqueSlug(c.slug, userId, c.id);

  let snapshot = c.formSnapshotJson ?? null;
  if (c.formTemplateId) {
    const { data: existing } = await supabase
      .from("campaigns")
      .select("form_template_id")
      .eq("id", c.id)
      .eq("owner_id", userId)
      .single();
    if (existing?.form_template_id !== c.formTemplateId) {
      snapshot = await fetchFormSnapshot(userId, c.formTemplateId);
    }
  } else {
    snapshot = null;
  }

  const payload = {
    title: c.title ?? c.name,
    name: c.name,
    slug: c.slug,
    type: c.type ?? "sms",
    message: c.message,
    recipients: c.recipients ?? [],
    status: c.status,
    updated_at: c.updatedAt ?? new Date().toISOString(),
    start_at: c.startAt ?? c.scheduledFor ?? null,
    end_at: c.endAt ?? null,
    form_template_id: c.formTemplateId ?? null,
    form_snapshot_json: snapshot,
  };

  const { error } = await supabase
    .from("campaigns")
    .update(payload)
    .eq("id", c.id)
    .eq("owner_id", userId);
  if (error) throw error;
}

/**
 * Delete a campaign by id.
 */
export async function removeCampaign(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("campaigns").delete().eq("id", id).eq("owner_id", userId);
  if (error) throw error;
}

/**
 * Update status for a campaign you own.
 */
export async function updateCampaignStatus(id: string, status: Campaign["status"]): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("campaigns")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", userId);

  if (error) throw error;
}

/**
 * Mark any due scheduled campaigns as sent (client-side helper).
 * NOTE: In production, do this on the server or via a scheduled job.
 * Returns the updated list (after mutation).
 */
export async function markSentIfDue(): Promise<Campaign[]> {
  const userId = await requireUserId();

  const nowIso = new Date().toISOString();

  // Update all that are due
  const { error: updErr } = await supabase
    .from("campaigns")
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("owner_id", userId)
    .eq("status", "scheduled")
    .lte("start_at", nowIso);

  if (updErr) throw updErr;

  // Return the fresh list
  return getCampaigns();
}
