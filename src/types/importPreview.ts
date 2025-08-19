export type AnyValue = string | number | boolean | null | undefined;

export interface CsvColumnSetting {
  addNew: boolean;
  linkTo: string | null;
}

export interface CsvPreview {
  headers: string[];
  rows: string[][];
  columns: Record<string, CsvColumnSetting>;
  fieldOptions: { key: string; label: string }[];
}

export interface JsonPreview {
  customers: Record<string, AnyValue>[];
  unknownKeys: string[];
  addFlags: Record<string, boolean>;
  keyToField: Record<string, string | null>;
  fieldOptions: { key: string; label: string }[];
}
