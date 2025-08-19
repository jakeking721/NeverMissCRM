// src/utils/email.ts
// Simple email normalization helper.
// Trims whitespace and lowercases the address; returns empty string if falsy.

export function normalizeEmail(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? s : "";
}
