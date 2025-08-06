// src/services/customerService.ts
// ------------------------------------------------------------------------------------
// Supabase-backed customer service (no localStorage, no getCurrentUser)
// - Uses supabase.auth.getUser() to resolve the current user
// - Mirrors your previous function signatures
// - Stores custom (non-base) fields in `extra` jsonb
// - Assumes RLS is enabled so users only see their own rows
// ------------------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  location?: string;
  signupDate: string; // ISO
  extra?: Record<string, any>;
  [key: string]: any;
};

async function requireUserId(): Promise<string> {
  if (import.meta.env.VITEST) throw new Error("Not authenticated");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Not authenticated");
  }
  return data.user.id;
}

/**
 * Fetch all customers for the current user.
 */
export async function getCustomers(): Promise<Customer[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("customers")
    .select("id, user_id, name, phone, location, signup_date, extra")
    .eq("user_id", userId)
    .order("signup_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    phone: row.phone,
    location: row.location ?? undefined,
    signupDate: row.signup_date,
    ...(row.extra ?? {}),
  }));
}

/**
 * Insert a single customer for the current user.
 */
export async function addCustomer(customer: Customer): Promise<void> {
  const userId = await requireUserId();

  const payload = {
    id: customer.id,
    user_id: customer.user_id ?? userId,
    name: customer.name,
    phone: customer.phone,
    location: customer.location ?? null,
    signup_date: customer.signupDate ?? new Date().toISOString(),
    extra: stripBaseColumns(customer),
  };

  const { error } = await supabase.from("customers").insert(payload);
  if (error) throw error;
}

/**
 * Update a customer by id (current user only).
 */
export async function updateCustomer(id: string, patch: Partial<Customer>): Promise<void> {
  const userId = await requireUserId();

  const payload: any = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.phone !== undefined) payload.phone = patch.phone;
  if (patch.location !== undefined) payload.location = patch.location;
  if (patch.signupDate !== undefined) payload.signup_date = patch.signupDate;

  // Merge custom fields into extra
  const extraPatch = stripBaseColumns(patch);
  if (Object.keys(extraPatch).length > 0) {
    const { data, error } = await supabase
      .from("customers")
      .select("extra")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error) throw error;

    payload.extra = { ...(data?.extra ?? {}), ...extraPatch };
  }

  const { error: upErr } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId);

  if (upErr) throw upErr;
}

/**
 * Remove a customer (current user only).
 */
export async function removeCustomer(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("customers").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

/**
 * Clear all customers for the current user (parity with old API).
 */
export async function clearCustomers(): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("customers").delete().eq("user_id", userId);
  if (error) throw error;
}

/**
 * Replace all customers for the current user.
 * (Delete then bulk insert. Not transactional from the client.)
 */
export async function replaceCustomers(customers: Customer[]): Promise<void> {
  const userId = await requireUserId();
  const { error: delErr } = await supabase.from("customers").delete().eq("user_id", userId);
  if (delErr) throw delErr;

  if (customers.length === 0) return;

  const rows = customers.map((c) => ({
    id: c.id,
    user_id: c.user_id ?? userId,
    name: c.name,
    phone: c.phone,
    location: c.location ?? null,
    signup_date: c.signupDate ?? new Date().toISOString(),
    extra: stripBaseColumns(c),
  }));

  const { error: insErr } = await supabase.from("customers").insert(rows);
  if (insErr) throw insErr;
}

// --------------------------------- helpers ---------------------------------

function stripBaseColumns(obj: Partial<Customer>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, user_id, name, phone, location, signupDate, extra, ...rest } = obj;
  return { ...(extra ?? {}), ...rest };
}
