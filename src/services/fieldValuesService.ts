// src/services/fieldValuesService.ts
// -----------------------------------------------------------------------------
// Helper service for reading/upserting customer custom field values
// Stored in table `customer_custom_field_values`
// -----------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";
import { getFields } from "./fieldsService";

export type FieldValueMap = Record<string, string | null>;

/**
 * Upsert custom field values for a single customer. Values are keyed by field `key`.
 */
export async function upsertFieldValues(
  customerId: string,
  values: FieldValueMap,
): Promise<void> {
  const fields = await getFields();
  const keyToId = Object.fromEntries(fields.map((f) => [f.key, f.id]));
  const rows = Object.entries(values)
    .filter(([k]) => keyToId[k])
    .map(([k, v]) => ({
      customer_id: customerId,
      field_id: keyToId[k],
      value: v ?? "",
    }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("customer_custom_field_values").upsert(rows);
  if (error) throw error;
}

/**
 * Fetch custom field values for many customers. Returned object is keyed by
 * customer id then by field key.
 */
export async function getFieldValuesForCustomers(
  customerIds: string[],
): Promise<Record<string, FieldValueMap>> {
  if (customerIds.length === 0) return {};
  const { data, error } = await supabase
    .from("customer_custom_field_values")
    .select("customer_id,value,custom_fields!inner(key)")
    .in("customer_id", customerIds);
  if (error) throw error;
  const result: Record<string, FieldValueMap> = {};
  for (const row of (data as any[]) || []) {
    const custId = row.customer_id;
    const key = row.custom_fields.key;
    if (!result[custId]) result[custId] = {};
    result[custId][key] = row.value;
  }
  return result;
}
