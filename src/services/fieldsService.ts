// src/services/fieldsService.ts
// ------------------------------------------------------------------------------------
// Custom fields service (Supabase-backed).
// Each row is stored in table `custom_fields` with columns:
//   id (uuid, PK), user_id (uuid), field_name, default_label, type,
//   options (jsonb), required (bool), order (int), "visibleOn" (jsonb),
//   is_active (bool), created_at, updated_at
// ------------------------------------------------------------------------------------

import { supabase } from "@/utils/supabaseClient";

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "email"
  | "phone"
  | "boolean"
  | "select"
  | "multiselect";

export type CustomField = {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  order: number;
  visibleOn: {
    dashboard: boolean;
    customers: boolean;
    campaigns: boolean;
  };
  archived?: boolean;
};

async function getCurrentUserId(): Promise<string | null> {
  if (import.meta.env.VITEST) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------------------
// READ
// ------------------------------------------------------------------------------------
export async function getFields(): Promise<CustomField[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("custom_fields")
    .select('id,field_name,default_label,type,options,required,order,"visibleOn",is_active')
    .eq("user_id", userId)
    .order("order", { ascending: true });

  if (error) {
    console.error("getFields error:", error);
    return [];
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    key: row.field_name,
    label: row.default_label,
    type: row.type,
    options: row.options ?? [],
    required: row.required ?? false,
    order: row.order ?? 0,
    visibleOn: row.visibleOn ?? { dashboard: false, customers: false, campaigns: false },
    archived: row.is_active === false,
  })) as CustomField[];
}

// ------------------------------------------------------------------------------------
// SAVE (replace all fields)
// ------------------------------------------------------------------------------------
export async function saveFields(fields: CustomField[]): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in.");

  // Overwrite: delete existing and upsert new rows (prevent duplicates by key)
  const { error: delErr } = await supabase.from("custom_fields").delete().eq("user_id", userId);
  if (delErr) throw delErr;

  if (fields.length > 0) {
    const rows = fields.map((f) => ({
      id: f.id,
      user_id: userId,
      field_name: f.key,
      default_label: f.label,
      type: f.type,
      options: f.options ?? [],
      required: f.required ?? false,
      order: f.order,
      ["visibleOn"]: f.visibleOn ?? { dashboard: false, customers: false, campaigns: false },
      is_active: f.archived === true ? false : true,
    }));
    const { error: upsertErr } = await supabase
      .from("custom_fields")
      .upsert(rows, { onConflict: "user_id,field_name" });
    if (upsertErr) throw upsertErr;
  }
}

// ------------------------------------------------------------------------------------
// ADD
// ------------------------------------------------------------------------------------
export async function addField(f: CustomField): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in.");
  const { error } = await supabase
    .from("custom_fields")
    .upsert(
      {
        id: f.id,
        user_id: userId,
        field_name: f.key,
        default_label: f.label,
        type: f.type,
        options: f.options ?? [],
        required: f.required ?? false,
        order: f.order,
        ["visibleOn"]: f.visibleOn ?? {
          dashboard: false,
          customers: false,
          campaigns: false,
        },
        is_active: f.archived === true ? false : true,
      },
      { onConflict: "user_id,field_name" }
    );
  if (error) throw error;
}

// ------------------------------------------------------------------------------------
// UPDATE
// ------------------------------------------------------------------------------------
export async function updateField(updated: CustomField): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in.");
  const { error } = await supabase
    .from("custom_fields")
    .update({
      field_name: updated.key,
      default_label: updated.label,
      type: updated.type,
      options: updated.options ?? [],
      required: updated.required ?? false,
      order: updated.order,
      ["visibleOn"]: updated.visibleOn,
      is_active: updated.archived === true ? false : true,
    })
    .eq("id", updated.id)
    .eq("user_id", userId);
  if (error) throw error;
}

// ------------------------------------------------------------------------------------
// REMOVE
// ------------------------------------------------------------------------------------
export async function removeField(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in.");
  const { error } = await supabase
    .from("custom_fields")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
