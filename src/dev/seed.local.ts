// src/dev/seed.ts
// Browser-side seeder. Call window.__seedDemo?.() in dev to populate localStorage.

import { registerUser, refreshCurrentUser } from "../utils/auth";
import { getFields, saveFields } from "../services/fieldsService";
import { replaceCustomers } from "../services/customerService";

export function seedDemo() {
  try {
    // Users
    registerUser({ username: "admin", email: "admin@example.com", password: "admin" });
    const userRes = registerUser({ username: "demo", email: "demo@example.com", password: "demo" });
    if (userRes.ok) refreshCurrentUser()({ ...userRes.user, role: "user", credits: 500 });

    // Fields
    const fields = getFields();
    if (fields.length === 0) {
      saveFields([
        {
          key: "zip",
          label: "ZIP Code",
          type: "text",
          visible: true,
          archived: false,
          required: false,
        },
      ]);
    }

    // Customers
    const sample = Array.from({ length: 10 }).map((_, i) => ({
      id: crypto.randomUUID?.() || String(i + 1),
      name: "Customer " + (i + 1),
      phone: "+1555000" + (100 + i),
      location: "City " + (i + 1),
      signupDate: new Date().toISOString(),
    }));

    replaceCustomers(sample);

    alert("Seed complete!");
  } catch (e) {
    console.error(e);
    alert("Seed failed: " + (e as any)?.message);
  }
}

// @ts-ignore
if (typeof window !== "undefined") window.__seedDemo = seedDemo;
