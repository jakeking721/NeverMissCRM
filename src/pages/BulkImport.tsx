// src/pages/BulkImport.tsx
// -----------------------------------------------------------------------------
// Wizard-based bulk import with custom field mapping
// -----------------------------------------------------------------------------

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import {
  upsertCustomers,
  type Customer,
  type DedupeOptions,
  type OverwritePolicy,
} from "@/services/customerService";
import { getFields, type CustomField, addField } from "@/services/fieldsService";

interface Mapping {
  header: string;
  mappedTo?: string; // existing field key
  createNew: boolean;
  type: CustomField["type"];
  options: string[];
}

export default function BulkImport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [dedupe, setDedupe] = useState<DedupeOptions>({ email: true, phone: false });
  const [overwrite, setOverwrite] = useState<OverwritePolicy>("keep");
  const [progress, setProgress] = useState(0);
  const total = rows.length;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { headers, rows: parsed } = parseCsv(text);
    const flds = await getFields();
    setFields(flds);
    const maps: Mapping[] = headers.map((h) => {
      const match = flds.find(
        (f) => f.key.toLowerCase() === h.toLowerCase() || f.label.toLowerCase() === h.toLowerCase(),
      );
      return {
        header: h,
        mappedTo: match ? match.key : undefined,
        createNew: !match,
        type: "text",
        options: [],
      };
    });
    setMappings(maps);
    setStep(1);
  };

  const handleImport = async () => {
    const userId = user!.id;
    // Create new fields first
    for (const m of mappings.filter((m) => m.createNew)) {
      const id = uuid();
      await addField({
        id,
        key: sanitizeKey(m.header),
        label: m.header,
        type: m.type,
        options: m.options,
        order: fields.length + 1,
        visibleOn: { dashboard: false, customers: true, campaigns: false },
      });
    }
    // Refresh fields
    await getFields();
    // Build customers from rows
    const customers: Customer[] = rows.map((r) => {
      const base: any = {
        id: uuid(),
        user_id: userId,
        name: "",
        signupDate: new Date().toISOString(),
      };
      const extra: Record<string, any> = {};
      mappings.forEach((m, i) => {
        const val = r[i];
        if (m.mappedTo || m.createNew) {
          const key = m.mappedTo || sanitizeKey(m.header);
          base[key] = val;
        } else {
          extra[m.header] = val;
        }
      });
      base.extra = extra;
      return base as Customer;
    });
    await upsertCustomers(
      customers,
      dedupe,
      overwrite,
      (done) => setProgress(done / total),
    );
    await getFields();
    navigate("/customers");
    setTimeout(() => window.location.reload(), 0);
  };

  if (step === 0) {
    return (
      <PageShell faintFlag>
        <div className="max-w-xl mx-auto pt-12 px-4 pb-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-6">Bulk Import Contacts</h1>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <input type="file" accept=".csv" onChange={handleFile} />
          </div>
        </div>
      </PageShell>
    );
  }

  if (step === 1) {
    return (
      <PageShell faintFlag>
        <div className="max-w-3xl mx-auto pt-12 px-4 pb-10">
          <h2 className="text-xl font-bold mb-4">Step 1 – Preview & Auto-Map</h2>
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
            <div className="flex gap-2 mb-4 text-sm">
              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() =>
                  setMappings((m) => m.map((x) => ({ ...x, createNew: true, mappedTo: undefined })))}
              >
                Add all as new fields
              </button>
              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() => {
                  const key = window.prompt("Map all to existing field key:");
                  if (key)
                    setMappings((m) =>
                      m.map((x) => ({ ...x, createNew: false, mappedTo: key })),
                    );
                }}
              >
                Map to existing…
              </button>
            </div>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr>
                  <th className="text-left">Column</th>
                  <th className="text-left">Map to</th>
                  <th className="text-left">New field?</th>
                  <th className="text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, idx) => (
                  <tr key={m.header} className="border-t">
                    <td className="py-2">{m.header}</td>
                    <td>
                      <select
                        value={m.mappedTo || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMappings((prev) => {
                            const copy = [...prev];
                            copy[idx].mappedTo = val || undefined;
                            copy[idx].createNew = !val;
                            return copy;
                          });
                        }}
                        className="border rounded p-1"
                      >
                        <option value="">--</option>
                        {fields.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={m.createNew}
                        onChange={(e) =>
                          setMappings((prev) => {
                            const copy = [...prev];
                            copy[idx].createNew = e.target.checked;
                            if (e.target.checked) copy[idx].mappedTo = undefined;
                            return copy;
                          })
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={m.type}
                        onChange={(e) =>
                          setMappings((prev) => {
                            const copy = [...prev];
                            copy[idx].type = e.target.value as any;
                            return copy;
                          })
                        }
                        className="border rounded p-1"
                        disabled={!m.createNew}
                      >
                        {[
                          "text",
                          "number",
                          "date",
                          "email",
                          "phone",
                          "boolean",
                          "select",
                          "multiselect",
                        ].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      {(m.createNew && (m.type === "select" || m.type === "multiselect")) && (
                        <input
                          className="border rounded p-1 mt-1 w-full"
                          placeholder="Options comma separated"
                          value={m.options.join(",")}
                          onChange={(e) =>
                            setMappings((prev) => {
                              const copy = [...prev];
                              copy[idx].options = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              return copy;
                            })
                          }
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setStep(0)}>
                Back
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(2)}>
                Next
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (step === 2) {
    return (
      <PageShell faintFlag>
        <div className="max-w-xl mx-auto pt-12 px-4 pb-10">
          <h2 className="text-xl font-bold mb-4">Step 2 – Duplicates</h2>
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dedupe.email}
                  onChange={(e) => setDedupe({ ...dedupe, email: e.target.checked })}
                />
                Match by Email
              </label>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={dedupe.phone}
                  onChange={(e) => setDedupe({ ...dedupe, phone: e.target.checked })}
                />
                Match by Phone
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span>On duplicate:</span>
              <select
                value={overwrite}
                onChange={(e) => setOverwrite(e.target.value as OverwritePolicy)}
                className="border rounded p-1"
              >
                <option value="keep">Keep existing</option>
                <option value="fill">Fill blanks only</option>
                <option value="overwrite">Overwrite all</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(3)}>
                Next
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // Step 3
  const mapped = mappings.filter((m) => m.mappedTo).length;
  const newFields = mappings.filter((m) => m.createNew).length;
  const unmapped = mappings.length - mapped - newFields;

  return (
    <PageShell faintFlag>
      <div className="max-w-xl mx-auto pt-12 px-4 pb-10">
        <h2 className="text-xl font-bold mb-4">Step 3 – Confirm</h2>
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex gap-2 flex-wrap text-sm">
            <span className="bg-blue-100 px-2 py-1 rounded">{mapped} mapped</span>
            <span className="bg-green-100 px-2 py-1 rounded">{newFields} new fields</span>
            <span className="bg-yellow-100 px-2 py-1 rounded">{unmapped} unmapped</span>
          </div>
          <div className="h-4 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-blue-600"
              style={{ width: `${Math.round(progress * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setStep(2)}>
              Back
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleImport}>
              Import
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function sanitizeKey(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
