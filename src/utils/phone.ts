// src/utils/phone.ts
// -----------------------------------------------------------------------------
// Phone helpers with optional libphonenumber-js support. If the library is
// unavailable (e.g. offline install), fall back to basic E.164 handling.
// -----------------------------------------------------------------------------

declare const require: any;

let parsePhoneNumberFromString: any;
try {
  // @ts-ignore - optional dependency
  ({ parsePhoneNumberFromString } = require("libphonenumber-js"));
} catch {
  // Library not available; fallback implementations will be used.
}

/** Normalize a phone number to E.164. Defaults to +1 if no country code.
 *  Returns null if parsing fails or there are fewer than 10 digits. */
export function normalizePhone(v: unknown): string | null {
  if (v == null) return null;
  const input = String(v).trim();
  if (!input) return null;

  if (parsePhoneNumberFromString) {
    try {
      const parsed = parsePhoneNumberFromString(input, "US");
      if (parsed && parsed.isValid()) return parsed.number; // already E.164
    } catch {
      /* ignore */
    }
  }

  const digits = input.replace(/\D/g, "");
  if (digits.length < 10) return null;

  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return `+${digits}`;
}

/** Format a phone number for display (e.g., "1+ (555) 233-4568"). */
export function formatPhone(v: unknown): string {
  const normalized = normalizePhone(v);
  if (!normalized) return "";

  if (parsePhoneNumberFromString) {
    try {
      const parsed = parsePhoneNumberFromString(normalized);
      if (parsed && parsed.isValid()) {
        return `${parsed.countryCallingCode}+ ${parsed.formatNational()}`;
      }
    } catch {
      /* ignore */
    }
  }

  const digits = normalized.replace(/\D/g, "");
  const country = digits.length > 10 ? digits.slice(0, digits.length - 10) : "1";
  const rest = digits.slice(-10);
  const area = rest.slice(0, 3);
  const prefix = rest.slice(3, 6);
  const line = rest.slice(6);
  return `${country}+ (${area}) ${prefix}-${line}`;
}
