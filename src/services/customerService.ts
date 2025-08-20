// src/services/customerService.ts
// -----------------------------------------------------------------------------
// Supabase-backed customer service with support for custom field values stored
// in `customer_custom_field_values` table. Extra unmapped columns are kept in
// `customers.extra`.
// -----------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";
import { normalizePhone } from "@/utils/phone";
import { normalizeEmail } from "@/utils/email";
import { getFields, type CustomField } from "./fieldsService";
import {
  upsertFieldValues,
  getFieldValuesForCustomers,
  type FieldValueMap,
} from "./fieldValuesService";

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  signupDate: string; // ISO
  extra?: Record<string, any>;
  [key: string]: any;
};

export type DedupeOptions = { email: boolean; phone: boolean };
export type OverwritePolicy = "keep" | "fill" | "overwrite" | "skip" | "update";
export type UpsertSummary = {
  created: number;
  updated: number;
  skipped: number;
  failures: { customer: Customer; reason: string }[];
};

async function requireUserId(): Promise<string> {
  if (import.meta.env.VITEST) throw new Error("Not authenticated");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Not authenticated");
  }
  return data.user.id;
}

// -----------------------------------------------------------------------------
// READ
// -----------------------------------------------------------------------------
export async function getCustomers(): Promise<Customer[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("customers")
    .select("id,user_id,name,phone,email,location,signup_date,extra")
    .eq("user_id", userId)
    .order("signup_date", { ascending: false });
  if (error) throw error;
  const ids = (data ?? []).map((r: any) => r.id);
  const fieldValues = await getFieldValuesForCustomers(ids);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    location: row.location ?? undefined,
    signupDate: row.signup_date,
    ...(fieldValues[row.id] ?? {}),
    ...(row.extra ?? {}),
  }));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("customers")
    .select("id,user_id,name,phone,email,location,signup_date,extra")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const fieldValues = await getFieldValuesForCustomers([data.id]);
  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    location: data.location ?? undefined,
    signupDate: data.signup_date,
    ...(fieldValues[data.id] ?? {}),
    ...(data.extra ?? {}),
  };
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
function splitCustomerFields(
  c: Partial<Customer>,
  fieldKeys: Set<string>,
) {
  const base: any = {
    id: c.id,
    user_id: c.user_id,
    name: c.name ?? "",
  };
  if (c.phone !== undefined) base.phone = normalizePhone(c.phone) || null;
  if (c.email !== undefined) base.email = normalizeEmail(c.email) || null;
  if (c.location !== undefined) base.location = c.location ?? null;
  base.signup_date = c.signupDate ?? new Date().toISOString();

  const custom: FieldValueMap = {};
  const extra: Record<string, any> = {};
  const others = stripBaseColumns(c);
  for (const [k, v] of Object.entries(others)) {
    if (fieldKeys.has(k)) custom[k] = v as any;
    else extra[k] = v;
  }
  return { base, custom, extra };
}

// -----------------------------------------------------------------------------
// WRITE
// -----------------------------------------------------------------------------
export async function addCustomer(customer: Customer): Promise<void> {
  const userId = await requireUserId();
  const fields = await getFields();
  const fieldKeys = new Set(fields.map((f) => f.key));
  const { base, custom, extra } = splitCustomerFields(
    { ...customer, user_id: customer.user_id ?? userId },
    fieldKeys,
  );
  base.extra = extra;
  const { error } = await supabase.from("customers").insert(base);
  if (error) throw error;
  await upsertFieldValues(base.id, custom);
}

export async function updateCustomer(
  id: string,
  patch: Partial<Customer>,
): Promise<void> {
  const userId = await requireUserId();
  const fields = await getFields();
  const fieldKeys = new Set(fields.map((f) => f.key));
  const { base, custom, extra } = splitCustomerFields(patch, fieldKeys);
  const payload: any = {};
  if (base.name !== undefined) payload.name = base.name;
  if (base.phone !== undefined) payload.phone = base.phone;
  if (base.email !== undefined) payload.email = base.email;
  if (base.location !== undefined) payload.location = base.location;
  if (patch.signupDate !== undefined) payload.signup_date = base.signup_date;
  if (Object.keys(extra).length > 0) {
    const { data, error } = await supabase
      .from("customers")
      .select("extra")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    payload.extra = { ...(data?.extra ?? {}), ...extra };
  }
  const { error: upErr } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId);
  if (upErr) throw upErr;
  await upsertFieldValues(id, custom);
}

export async function removeCustomer(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function clearCustomers(): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

export async function upsertCustomers(
  customers: Customer[],
  dedupe: DedupeOptions = { email: true, phone: false },
  overwrite: OverwritePolicy = "keep",
  onProgress?: (done: number, total: number) => void,
): Promise<UpsertSummary> {
  const userId = await requireUserId();
  const fields = await getFields();
  const fieldKeys = new Set(fields.map((f) => f.key));
  const summary: UpsertSummary = { created: 0, updated: 0, skipped: 0, failures: [] };
  const total = customers.length;
  let processed = 0;
  const mode = overwrite === "skip" ? "keep" : overwrite === "update" ? "overwrite" : overwrite;
  const chunkSize = 500;
  for (let i = 0; i < customers.length; i += chunkSize) {
    const chunk = customers.slice(i, i + chunkSize);
    for (const c of chunk) {
      const { base, custom, extra } = splitCustomerFields(
        { ...c, user_id: c.user_id ?? userId },
        fieldKeys,
      );
      base.extra = extra;
      const phone = base.phone;
      const email = base.email;
      const filters: string[] = [];
      if (dedupe.phone && phone) filters.push(`phone.eq.${phone}`);
      if (dedupe.email && email) filters.push(`email.eq.${email}`);
      let existing: { id: string } | null = null;
      if (filters.length > 0) {
        const { data } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", userId)
          .or(filters.join(","))
          .limit(1)
          .maybeSingle();
        existing = data as any;
      }
      if (existing) {
        if (mode === "overwrite") {
          const { error: upErr } = await supabase
            .from("customers")
            .update(base)
            .eq("id", existing.id)
            .eq("user_id", userId);
          if (upErr) throw upErr;
          await upsertFieldValues(existing.id, custom);
          summary.updated += 1;
        } else if (mode === "fill") {
          const { data: existData } = await supabase
            .from("customers")
            .select("name,phone,email,location,extra")
            .eq("id", existing.id)
            .single();
          const patch: any = {};
          if (!existData.name && base.name) patch.name = base.name;
          if (!existData.phone && base.phone) patch.phone = base.phone;
          if (!existData.email && base.email) patch.email = base.email;
          if (!existData.location && base.location) patch.location = base.location;
          if (Object.keys(extra).length)
            patch.extra = { ...(existData.extra ?? {}), ...extra };
          if (Object.keys(patch).length) {
            const { error: upErr } = await supabase
              .from("customers")
              .update(patch)
              .eq("id", existing.id)
              .eq("user_id", userId);
            if (upErr) throw upErr;
          }
          await upsertFieldValues(existing.id, custom);
          summary.updated += 1;
        } else {
          summary.skipped += 1;
          summary.failures.push({ customer: c, reason: "duplicate" });
        }
      } else {
        const { error: insErr } = await supabase.from("customers").insert(base);
        if (insErr) throw insErr;
        await upsertFieldValues(base.id, custom);
        summary.created += 1;
      }
      processed += 1;
      onProgress?.(processed, total);
    }
  }
  return summary;
}

export async function addCustomers(
  customers: Customer[],
  dedupe: DedupeOptions = { email: true, phone: false },
  overwrite: OverwritePolicy = "keep",
  onProgress?: (done: number, total: number) => void,
): Promise<UpsertSummary> {
  return upsertCustomers(customers, dedupe, overwrite, onProgress);
}

export async function replaceCustomers(customers: Customer[]): Promise<void> {
  const userId = await requireUserId();
  const { error: delErr } = await supabase
    .from("customers")
    .delete()
    .eq("user_id", userId);
  if (delErr) throw delErr;
  if (customers.length === 0) return;
  const fields = await getFields();
  const fieldKeys = new Set(fields.map((f) => f.key));
  const rows: any[] = [];
  const customs: { id: string; values: FieldValueMap }[] = [];
  for (const c of customers) {
    const { base, custom, extra } = splitCustomerFields(
      { ...c, user_id: c.user_id ?? userId },
      fieldKeys,
    );
    base.extra = extra;
    rows.push(base);
    customs.push({ id: base.id, values: custom });
  }
  const { error: insErr } = await supabase.from("customers").insert(rows);
  if (insErr) throw insErr;
  for (const c of customs) {
    await upsertFieldValues(c.id, c.values);
  }
}

// -----------------------------------------------------------------------------
// Utility
// -----------------------------------------------------------------------------
function stripBaseColumns(obj: Partial<Customer>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, user_id, name, phone, email, location, signupDate, extra, ...rest } = obj;
  return { ...(extra ?? {}), ...rest };
}
