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

export interface CustomField {
  id: string;
  user_id: string;
  key: string;
  label: string;
  type: FieldType;
  options?: string[] | null;
  required?: boolean;
  order?: number;
  archived?: boolean;
  visibleOn?: {
    dashboard?: boolean;
    customers?: boolean;
    campaigns?: boolean;
    [k: string]: any;
  } | null;
  created_at?: string;
}

export function fromDb(row: any): CustomField {
  const { visible_on, ...rest } = row;
  return { ...rest, visibleOn: visible_on ?? null } as CustomField;
}

export function toDb(obj: Partial<CustomField>): any {
  const { visibleOn, ...rest } = obj;
  return visibleOn === undefined ? rest : { ...rest, visible_on: visibleOn };
}

export async function getFields(): Promise<CustomField[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];
  return getFieldsForUser(userId);
}

export async function getFieldsForUser(userId: string): Promise<CustomField[]> {
  const { data, error } = await supabase
    .from("custom_fields")
    .select(
      "id,user_id,key,label,type,options,required,\"order\",archived,visible_on,created_at"
    )
    .eq("user_id", userId)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromDb);
}

export async function createField(payload: CustomField): Promise<CustomField | null> {
  const { data, error } = await supabase
    .from("custom_fields")
    .insert(toDb(payload))
    .select(
      "id,user_id,key,label,type,options,required,\"order\",archived,visible_on,created_at"
    )
    .single();
  if (error) throw error;
  return data ? fromDb(data) : null;
}

export async function updateField(
  id: string,
  patch: Partial<CustomField>
): Promise<CustomField | null> {
  const { data, error } = await supabase
    .from("custom_fields")
    .update(toDb(patch))
    .eq("id", id)
    .select(
      "id,user_id,key,label,type,options,required,\"order\",archived,visible_on,created_at"
    )
    .single();
  if (error) throw error;
  return data ? fromDb(data) : null;
}

export async function upsertField(payload: CustomField): Promise<CustomField | null> {
  const { data, error } = await supabase
    .from("custom_fields")
    .upsert(toDb(payload))
    .select(
      "id,user_id,key,label,type,options,required,\"order\",archived,visible_on,created_at"
    )
    .single();
  if (error) throw error;
  return data ? fromDb(data) : null;
}

export async function deleteField(id: string): Promise<void> {
  const { error } = await supabase.from("custom_fields").delete().eq("id", id);
  if (error) throw error;
}

