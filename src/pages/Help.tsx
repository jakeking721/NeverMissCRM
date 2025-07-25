// src/pages/Help.tsx
// ------------------------------------------------------------------------------------
// Simple, styled help page explaining:
// - Credits
// - Custom fields
// - Import/Export
// - Campaigns vs Bulk SMS
// ------------------------------------------------------------------------------------

import React from "react";
import PageShell from "../components/PageShell";

export default function Help() {
  return (
    <PageShell faintFlag>
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-semibold mb-2">Help & Documentation</h1>
          <p className="text-sm text-gray-600">
            Quick reference for how NeverMissCRM works today (local demo) and how it’ll grow.
          </p>
        </header>

        <Section title="Credits">
          <p className="text-sm text-gray-700">
            Credits are consumed whenever you send SMS messages. The cost is proportional to the
            number of recipients and the length of the message. Admins can top-up credits directly.
            Non-admin users will be able to purchase credits once a POS/Stripe integration is added.
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
            <li>Admins can add credits from the Admin Dashboard.</li>
            <li>Users can see their current credit balance on the Dashboard.</li>
            <li>Test sends also consume credits (configurable later).</li>
          </ul>
        </Section>

        <Section title="Custom Fields">
          <p className="text-sm text-gray-700">
            You can define any fields you want (text, select, boolean, etc.) and control where they
            show up (Dashboard, Customers, Campaigns).
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
            <li>
              Go to <code>/settings/fields</code> to add, edit, reorder, or archive fields.
            </li>
            <li>Only fields with the “Customers” visibility appear in the Customers table.</li>
            <li>Only fields with the “Dashboard” visibility appear in the Add Contact form.</li>
          </ul>
        </Section>

        <Section title="Import / Export">
          <p className="text-sm text-gray-700">
            The Customers page supports JSON import/export today. A CSV importer with robust
            validation, a dry-run preview, and schema mapping is planned.
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
            <li>Find the Import/Export buttons at the top right of the Customers page.</li>
            <li>Only admins or paying users will get access in the future.</li>
          </ul>
        </Section>

        <Section title="Campaigns vs Bulk SMS">
          <p className="text-sm text-gray-700">
            Use <strong>Campaigns</strong> to schedule and track larger sends (with drafts,
            statuses, etc.). Use <strong>Bulk SMS</strong> on the Customers page to immediately
            message an ad‑hoc set of recipients.
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
            <li>Campaigns have a “test send” and a schedule picker.</li>
            <li>Bulk SMS lets you quickly select customers and send right away.</li>
            <li>Both subtract credits based on your configured cost and message length.</li>
          </ul>
        </Section>

        <Section title="Roadmap (Back-end)">
          <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
            <li>Swap localStorage with a proper DB (Supabase/Firebase/Postgres + REST/trpc).</li>
            <li>React Query for data fetching/cache.</li>
            <li>Stripe for credits/billing.</li>
            <li>Server-side SMS scheduling (cron/queues).</li>
            <li>Role-based access (admin/user) fully enforced server-side.</li>
          </ul>
        </Section>
      </div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="p-4 bg-white rounded-md shadow border">
      <h2 className="text-lg font-medium mb-2">{title}</h2>
      {children}
    </section>
  );
}
