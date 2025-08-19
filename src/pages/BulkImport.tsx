// src/pages/BulkImport.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { v4 as uuid } from "uuid";
import {
  upsertCustomers,
  Customer,
  type OverwritePolicy,
} from "@/services/customerService";
import { normalizePhone } from "@/utils/phone";
import { normalizeEmail } from "@/utils/email";
import { useAuth } from "@/context/AuthContext";

export default function BulkImport() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const { user } = useAuth();
  const [matchEmail, setMatchEmail] = useState(true);
  const [matchPhone, setMatchPhone] = useState(false);
  const [overwrite, setOverwrite] = useState<OverwritePolicy>("skip");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const { customers, failures, headers } = parseCsv(text, user!.id);
      if (customers.length === 0) {
        alert("No valid rows found in CSV.");
      } else {
        const summary = await upsertCustomers(
          customers,
          { email: matchEmail, phone: matchPhone },
          overwrite,
        );
        const invalid = failures.length;
        alert(
          `Created ${summary.created}, Updated ${summary.updated}, Skipped ${summary.skipped}, Invalid ${invalid}.`,
        );

        const allFailures = [
          ...failures.map((f) => ({ row: f.row, reason: f.reason })),
          ...summary.failures.map((f) => ({
            row: headers.map((h) => String((f.customer as any)[h] ?? "")),
            reason: f.reason,
          })),
        ];
        if (allFailures.length > 0) {
          const csv = [
            [...headers, "reason"].join(","),
            ...allFailures.map((r) => [...r.row, r.reason].join(",")),
          ].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = Object.assign(document.createElement("a"), {
            href: url,
            download: "import_failures.csv",
          });
          a.click();
          URL.revokeObjectURL(url);
        }
        navigate("/customers");
        setTimeout(() => window.location.reload(), 0);
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to import CSV.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-blue-50 relative overflow-x-hidden"
      style={{
        background: `url('/flag-bg.svg') center top / cover no-repeat, linear-gradient(to bottom right, #e0e8f8 50%, #f8fafc 100%)`,
      }}
    >
      <Header />
      <div className="max-w-2xl mx-auto pt-12 px-4 pb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-6">
          Bulk Import Contacts
        </h1>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="mb-4 text-sm text-gray-600">
            Upload a CSV file with columns like <code>name</code>, <code>phone</code>, and optional
            additional fields. Existing contacts will be updated or added.
          </p>
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium">Duplicate Handling</label>
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={matchEmail}
                  onChange={(e) => setMatchEmail(e.target.checked)}
                />
                Match duplicates by Email
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={matchPhone}
                  onChange={(e) => setMatchPhone(e.target.checked)}
                />
                Match duplicates by Phone
              </label>
              <div className="flex items-center gap-2">
                <span>On duplicate</span>
                <select
                  className="border rounded px-2 py-1"
                  value={overwrite}
                  onChange={(e) => setOverwrite(e.target.value as OverwritePolicy)}
                >
                  <option value="skip">Skip</option>
                  <option value="update">Update</option>
                </select>
              </div>
            </div>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            disabled={importing}
            className="mb-4"
          />
          {importing && <div className="text-sm text-gray-500">Importing…</div>}
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function parseCsv(text: string, userId: string): {
  customers: Customer[];
  failures: { row: string[]; reason: string }[];
  headers: string[];
} {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { customers: [], failures: [], headers: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const customers: Customer[] = [];
  const failures: { row: string[]; reason: string }[] = [];
  lines.slice(1).forEach((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? "";
    });
    const { name = "", phone = "", email = "", location = "", ...extra } = obj;
    const normPhone = normalizePhone(phone);
    const normEmail = normalizeEmail(email);
    if ((phone && !normPhone) || (email && !normEmail)) {
      failures.push({ row: cols, reason: "invalid" });
      return;
    }
    customers.push({
      id: uuid(),
      user_id: userId,
      name,
      phone: normPhone || null,
      email: normEmail || null,
      location,
      signupDate: new Date().toISOString(),
      ...extra,
    } as Customer);
  });
  return { customers, failures, headers };
}
