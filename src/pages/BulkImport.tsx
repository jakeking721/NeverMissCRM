// src/pages/BulkImport.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { v4 as uuid } from "uuid";
import { upsertCustomers, Customer } from "@/services/customerService";
import { normalizePhone } from "@/utils/phone";
import { useAuth } from "@/context/AuthContext";

export default function BulkImport() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const { user } = useAuth();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const customers = parseCsv(text, user!.id);
      if (customers.length === 0) {
        alert("No rows found in CSV.");
      } else {
        await upsertCustomers(customers);
        alert(`Imported ${customers.length} contacts.`);
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

function parseCsv(text: string, userId: string): Customer[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? "";
    });
    const { name = "", phone = "", location = "", ...extra } = obj;
    return {
      id: uuid(),
      user_id: userId,
      name,
      phone: normalizePhone(phone),
      location,
      signupDate: new Date().toISOString(),
      ...extra,
    } as Customer;
  });
}
