// src/services/fieldsService.ts
// ------------------------------------------------------------------------------------
// Custom fields service (Supabase-backed).
// Each row is stored in table `custom_fields` with columns:
//   id (uuid, PK), user_id (uuid), key, label, type, options (jsonb),
//   required (bool), order (int), visibleOn (jsonb), archived (bool)
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
    .select("*")
    .eq("user_id", userId)
    .order("order", { ascending: true });

  if (error) {
    console.error("getFields error:", error);
    return [];
  }
  return (data ?? []) as CustomField[];
}

// ------------------------------------------------------------------------------------
// SAVE (replace all fields)
// ------------------------------------------------------------------------------------
export async function saveFields(fields: CustomField[]): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in.");

  // Overwrite: delete existing and insert new
  const { error: delErr } = await supabase.from("custom_fields").delete().eq("user_id", userId);
  if (delErr) throw delErr;

  if (fields.length > 0) {
    const rows = fields.map((f) => ({
      ...f,
      user_id: userId,
      options: f.options ?? [],
      visibleOn: f.visibleOn ?? { dashboard: false, customers: false, campaigns: false },
      archived: f.archived ?? false,
    }));
    const { error: insErr } = await supabase.from("custom_fields").insert(rows);
    if (insErr) throw insErr;
  }
}

// ------------------------------------------------------------------------------------
// ADD
// ------------------------------------------------------------------------------------
export async function addField(f: CustomField): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in.");
  const { error } = await supabase.from("custom_fields").insert({
    ...f,
    user_id: userId,
    options: f.options ?? [],
    visibleOn: f.visibleOn ?? { dashboard: false, customers: false, campaigns: false },
    archived: f.archived ?? false,
  });
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
      key: updated.key,
      label: updated.label,
      type: updated.type,
      options: updated.options ?? [],
      required: updated.required ?? false,
      order: updated.order,
      visibleOn: updated.visibleOn,
      archived: updated.archived ?? false,
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
  const { error } = await supabase.from("custom_fields").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
