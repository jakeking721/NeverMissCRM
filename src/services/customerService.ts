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
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  zipCode?: string | null;
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
    .select("id,user_id,first_name,last_name,phone,email,zip_code,created_at,extra")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const ids = (data ?? []).map((r: any) => r.id);
  const fieldValues = await getFieldValuesForCustomers(ids);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    zipCode: row.zip_code ?? undefined,
    signupDate: row.created_at,
    ...(fieldValues[row.id] ?? {}),
    ...(row.extra ?? {}),
  }));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("customers")
    .select("id,user_id,first_name,last_name,phone,email,zip_code,created_at,extra")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const fieldValues = await getFieldValuesForCustomers([data.id]);
  return {
    id: data.id,
    user_id: data.user_id,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    zipCode: data.zip_code ?? undefined,
    signupDate: data.created_at,
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
    first_name: c.firstName ?? "",
    last_name: c.lastName ?? "",
  };
  if (c.phone !== undefined) base.phone = normalizePhone(c.phone) || null;
  if (c.email !== undefined) base.email = normalizeEmail(c.email) || null;
  if (c.zipCode !== undefined) base.zip_code = c.zipCode ?? null;
  base.created_at = c.signupDate ?? new Date().toISOString();

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
  if (base.first_name !== undefined) payload.first_name = base.first_name;
  if (base.last_name !== undefined) payload.last_name = base.last_name;
  if (base.phone !== undefined) payload.phone = base.phone;
  if (base.email !== undefined) payload.email = base.email;
  if (base.zip_code !== undefined) payload.zip_code = base.zip_code;
  if (patch.signupDate !== undefined) payload.created_at = base.created_at;
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
          .select("first_name,last_name,phone,email,zip_code,extra")
          .eq("id", existing.id)
          .single();
        const patch: any = {};
        if (!existData.first_name && base.first_name) patch.first_name = base.first_name;
        if (!existData.last_name && base.last_name) patch.last_name = base.last_name;
        if (!existData.phone && base.phone) patch.phone = base.phone;
        if (!existData.email && base.email) patch.email = base.email;
        if (!existData.zip_code && base.zip_code) patch.zip_code = base.zip_code;
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
  const {
    id,
    user_id,
    firstName,
    lastName,
    phone,
    email,
    zipCode,
    signupDate,
    extra,
    ...rest
  } = obj;
  return { ...(extra ?? {}), ...rest };
}
