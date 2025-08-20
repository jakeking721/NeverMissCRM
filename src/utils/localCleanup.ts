// src/utils/localCleanup.ts
// Utility helpers to clear placeholder data stored in localStorage.
// This prevents stale demo state from persisting between sessions.

/**
 * Remove placeholder/demo entries from localStorage.
 * Currently clears temporary SMS logs and demo customer data.
 */
export function clearLocalPlaceholders() {
  try {
    // Remove any SMS logs that were stored locally for demo purposes
    Object.keys(localStorage)
      .filter((key) => key.startsWith("sms_log_"))
      .forEach((key) => localStorage.removeItem(key));

    // Remove any locally stored demo customers
    localStorage.removeItem("customers");
  } catch {
    // ignore errors accessing localStorage (e.g., SSR)
  }
}
