// src/services/customerService.ts
// -----------------------------------------------------------------------------
// Supabase-backed customer service that also reads from `customer_latest_values`
// for custom field columns. Extra unmapped columns are kept in `customers.extra`.
// -----------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";
import { normalizePhone } from "@/utils/phone";
import { normalizeEmail } from "@/utils/email";
import { getFields, type FieldType } from "./fieldsService";

function normalizeCustomValue(type: FieldType, value: any): any {
  if (value === null || value === undefined || value === "") return null;
  try {
    switch (type) {
      case "number": {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
      }
      case "boolean":
        if (typeof value === "boolean") return value;
        if (value === "true" || value === "1" || value === 1) return true;
        if (value === "false" || value === "0" || value === 0) return false;
        return null;
      case "date": {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d.toISOString();
      }
      case "multiselect":
        return Array.isArray(value) ? value.map(String) : [String(value)];
      default:
        return String(value);
    }
  } catch {
    return null;
  }
}

export type Customer = {
  id: string;
  user_id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  zipCode?: string | null;
  signupDate: string; // ISO
  form_name?: string | null;
  campaign_name?: string | null;
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
export type CustomerQuery = {
  search?: string;
  sortBy?: string;
  ascending?: boolean;
  radiusFilter?: { zip: string; miles: number };
  filters?: Record<string, any>;
};

export async function getCustomers(opts: CustomerQuery = {}): Promise<Customer[]> {
  const { search, sortBy, ascending, radiusFilter, filters } = opts;
  const userId = await requireUserId();

  type ColMap = { column: string; table?: string };
  const columnMap: Record<string, ColMap> = {
    firstName: { column: "first_name" },
    lastName: { column: "last_name" },
    phone: { column: "phone" },
    email: { column: "email" },
    zipCode: { column: "zip_code" },
    signupDate: { column: "created_at" },
    form_name: { column: "title", table: "campaign_forms" },
    campaign_name: { column: "title", table: "intake_campaigns" },
  };

  let query = supabase
    .from("customers")
    .select(
      "id,user_id,first_name,last_name,phone,email,zip_code,created_at,extra,campaign_forms(title),intake_campaigns(title)"
    )
    .eq("user_id", userId);

  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      const col = columnMap[k];
      if (col) {
        if (col.table) query = query.eq(`${col.table}.${col.column}`, v);
        else query = query.eq(col.column, v);
      } else query = query.eq(`extra->>${k}`, v);
    }
  }

  if (search) {
    const q = `%${search}%`;
    query = query.or(
      [
        `first_name.ilike.${q}`,
        `last_name.ilike.${q}`,
        `phone.ilike.${q}`,
        `email.ilike.${q}`,
        `zip_code.ilike.${q}`,
        `campaign_forms.title.ilike.${q}`,
        `intake_campaigns.title.ilike.${q}`,
      ].join(","),
    );
  }

  if (sortBy) {
    const col = columnMap[sortBy];
    if (col)
      query = query.order(col.column, {
        ascending: ascending ?? true,
        ...(col.table ? { foreignTable: col.table } : {}),
      });
    else query = query.order(`extra->>${sortBy}`, { ascending: ascending ?? true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  let result = (data ?? []).map((row: any) => {
    const extra = row.extra ?? {};
    return {
      id: row.id,
      user_id: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      zipCode: row.zip_code ?? undefined,
      signupDate: row.created_at,
      form_name: row.campaign_forms?.title ?? null,
      campaign_name: row.intake_campaigns?.title ?? null,
      extra,
      ...extra,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    result = result.filter((c) => {
      const baseHit =
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.zipCode?.toLowerCase().includes(q) ||
        c.signupDate?.toLowerCase().includes(q) ||
        (c as any).form_name?.toLowerCase?.().includes(q) ||
        (c as any).campaign_name?.toLowerCase?.().includes(q);
      if (baseHit) return true;
      return Object.values(c).some((v) => {
        if (v == null) return false;
        if (typeof v === "string") return v.toLowerCase().includes(q);
        if (typeof v === "number") return String(v).includes(q);
        return false;
      });
    });
  }

  if (radiusFilter) {
    console.warn("Zip radius filter not implemented", radiusFilter);
  }

  return result;
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

  const extra = data.extra ?? {};
  return {
    id: data.id,
    user_id: data.user_id,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    zipCode: data.zip_code ?? undefined,
    signupDate: data.created_at,
    extra,
    ...extra,
  };
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
function splitCustomerFields(
  c: Partial<Customer>,
  fieldMap: Record<string, FieldType>,
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

  const extra: Record<string, any> = {};
  const others = stripBaseColumns(c);
  for (const [k, v] of Object.entries(others)) {
    const type = fieldMap[k];
    if (type) {
      const norm = normalizeCustomValue(type, v);
      if (norm !== null) extra[k] = norm;
    } else {
      extra[k] = v;
    }
  }
  return { base, extra };
}

// -----------------------------------------------------------------------------
// WRITE
// -----------------------------------------------------------------------------
export async function addCustomer(customer: Customer): Promise<void> {
  const userId = await requireUserId();
  const fields = await getFields();
  const fieldMap = Object.fromEntries(fields.map((f) => [f.key, f.type]));
  const { base, extra } = splitCustomerFields(
    { ...customer, user_id: customer.user_id ?? userId },
    fieldMap,
  );
  base.extra = extra;
  const { error } = await supabase.from("customers").insert(base);
  if (error) throw error;
}

export async function updateCustomer(
  id: string,
  patch: Partial<Customer>,
): Promise<void> {
  const userId = await requireUserId();
  const fields = await getFields();
  const fieldMap = Object.fromEntries(fields.map((f) => [f.key, f.type]));
  const { base, extra } = splitCustomerFields(patch, fieldMap);
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
    const merged = { ...(data?.extra ?? {}) };
    for (const [k, v] of Object.entries(extra)) {
      const existing = merged[k];
      if (
        existing !== undefined &&
        existing !== null &&
        v !== null &&
        typeof existing !== typeof v
      ) {
        continue;
      }
      merged[k] = v;
    }
    payload.extra = merged;
  }
  const { error: upErr } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId);
  if (upErr) throw upErr;
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
  const fieldMap = Object.fromEntries(fields.map((f) => [f.key, f.type]));
  const summary: UpsertSummary = { created: 0, updated: 0, skipped: 0, failures: [] };
  const total = customers.length;
  let processed = 0;
  const mode = overwrite === "skip" ? "keep" : overwrite === "update" ? "overwrite" : overwrite;
  const chunkSize = 500;
  for (let i = 0; i < customers.length; i += chunkSize) {
    const chunk = customers.slice(i, i + chunkSize);
    for (const c of chunk) {
      const { base, extra } = splitCustomerFields(
        { ...c, user_id: c.user_id ?? userId },
        fieldMap,
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
          summary.updated += 1;
        } else if (mode === "fill") {
          const { data: existData } = await supabase
            .from("customers")
            .select("first_name,last_name,phone,email,zip_code,extra")
            .eq("id", existing.id)
            .single();
          if (!existData) continue;
          const patch: any = {};
          if (!existData.first_name && base.first_name) patch.first_name = base.first_name;
          if (!existData.last_name && base.last_name) patch.last_name = base.last_name;
          if (!existData.phone && base.phone) patch.phone = base.phone;
          if (!existData.email && base.email) patch.email = base.email;
          if (!existData.zip_code && base.zip_code) patch.zip_code = base.zip_code;
          if (Object.keys(extra).length) {
            const merged = { ...(existData.extra ?? {}) };
            for (const [k, v] of Object.entries(extra)) {
              const existingVal = merged[k];
              if (
                existingVal !== undefined &&
                existingVal !== null &&
                v !== null &&
                typeof existingVal !== typeof v
              ) {
                continue;
              }
              merged[k] = v;
            }
            patch.extra = merged;
          }
          if (Object.keys(patch).length) {
            const { error: upErr } = await supabase
              .from("customers")
              .update(patch)
              .eq("id", existing.id)
              .eq("user_id", userId);
            if (upErr) throw upErr;
          }
          summary.updated += 1;
        } else {
          summary.skipped += 1;
          summary.failures.push({ customer: c, reason: "duplicate" });
        }
      } else {
        const { error: insErr } = await supabase.from("customers").insert(base);
        if (insErr) throw insErr;
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
  const fieldMap = Object.fromEntries(fields.map((f) => [f.key, f.type]));
  const rows: any[] = [];
  for (const c of customers) {
    const { base, extra } = splitCustomerFields(
      { ...c, user_id: c.user_id ?? userId },
      fieldMap,
    );
    base.extra = extra;
    rows.push(base);
  }
  const { error: insErr } = await supabase.from("customers").insert(rows);
  if (insErr) throw insErr;
}

// -----------------------------------------------------------------------------
// Utility
// -----------------------------------------------------------------------------
/* eslint-disable @typescript-eslint/no-unused-vars */
function stripBaseColumns(obj: Partial<Customer>): Record<string, any> {
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
/* eslint-enable @typescript-eslint/no-unused-vars */
