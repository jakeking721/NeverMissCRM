// src/utils/profiles.ts
// -----------------------------------------------------------------------------
// Utilities for working with profile records.
// -----------------------------------------------------------------------------

/** Determine the column used to order profile queries. */
export function getProfilesOrderKey() {
  return "updated_at";
}
