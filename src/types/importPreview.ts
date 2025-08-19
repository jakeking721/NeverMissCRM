export type AnyValue = string | number | boolean | null | undefined;

export interface CsvPreview {
  headers: string[];
  rows: string[][];
  headerToKey: Record<string, string | null>;
  unmatchedHeaders: string[];
  addFlags: Record<string, boolean>;
  fieldOptions: { key: string; label: string }[];
}

export interface JsonPreview {
  customers: Record<string, AnyValue>[];
  unknownKeys: string[];
  addFlags: Record<string, boolean>;
  keyToField: Record<string, string | null>;
  fieldOptions: { key: string; label: string }[];
}
