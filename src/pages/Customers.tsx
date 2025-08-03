// src/pages/Customers.tsx
// ------------------------------------------------------------------------------------
// Customers page (Supabase-backed services)
// - Dynamic columns from custom fields
// - Bulk selection + SmsBulkModal
// - Import/Export JSON + CSV stubs (client-side)
// ------------------------------------------------------------------------------------

import React from "react";
import { v4 as uuid } from "uuid";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import SmsBulkModal from "@/components/SmsBulkModal";

import {
  getCustomers,
  replaceCustomers,
  Customer as SbcCustomer,
} from "@/services/customerService";

import { getFields, addField, CustomField } from "@/services/fieldsService";
import { toKeySlug } from "@/utils/slug";

type AnyValue = string | number | boolean | null | undefined;
type Customer = SbcCustomer;

// ---- CSV helpers (no external deps) -----------------------------------------
function parseCSV(text: string, delimiter = ","): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const headers = parseLine(lines[0]);
  const rows = lines
    .slice(1)
    .map(parseLine)
    .filter((r) => r.some((v) => v && v.length > 0));

  return { headers, rows };
}

type CsvPreview = {
  headers: string[];
  rows: string[][];
  headerToKey: Record<string, string | null>;
  unmatchedHeaders: string[];
  addFlags: Record<string, boolean>;
  errors: string[];
};

type JsonPreview = {
  customers: any[];
  unknownKeys: string[];
  addFlags: Record<string, boolean>;
};

export default function Customers() {
  const { user } = useAuth();

  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<string>("signupDate");
  const [ascending, setAscending] = React.useState<boolean>(false);

  const [customFields, setCustomFields] = React.useState<CustomField[]>([]);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Fetch fields (still localStorage-backed for now)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await getFields();
      if (cancelled) return;
      const all = list
        .filter((f) => !f.archived && f.visibleOn.customers)
        .sort((a, b) => a.order - b.order);
      setCustomFields(all);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Initial load of customers
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) {
        setCustomers([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const list = await getCustomers();
        if (mounted) setCustomers(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const reloadCustomers = React.useCallback(async () => {
    try {
      const list = await getCustomers();
      setCustomers(list);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const baseColumns = React.useMemo(
    () =>
      [
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "location", label: "Location" },
        { key: "signupDate", label: "Signup" },
      ] as const,
    []
  );

  const columns = React.useMemo(
    () => [...baseColumns, ...customFields.map((f) => ({ key: f.key, label: f.label }))],
    [baseColumns, customFields]
  );

  const onSort = (key: string) => {
    if (sortBy === key) {
      setAscending((v) => !v);
    } else {
      setSortBy(key);
      setAscending(true);
    }
  };

  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = customers.filter((c) => {
      if (!s) return true;

      const baseHit =
        (c.name?.toLowerCase?.().includes(s) ?? false) ||
        (c.phone?.toLowerCase?.().includes(s) ?? false) ||
        (c.location?.toLowerCase?.().includes(s) ?? false) ||
        (c.signupDate?.toLowerCase?.().includes(s) ?? false);

      if (baseHit) return true;

      for (const f of customFields) {
        const v = (c as any)[f.key];
        if (typeof v === "string" && v.toLowerCase().includes(s)) return true;
        if (typeof v === "number" && String(v).includes(s)) return true;
      }
      return false;
    });

    const sorted = list.slice().sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];

      if (av == null && bv == null) return 0;
      if (av == null) return ascending ? -1 : 1;
      if (bv == null) return ascending ? 1 : -1;

      if (typeof av === "number" && typeof bv === "number") {
        return ascending ? av - bv : bv - av;
      }
      return ascending
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return sorted;
  }, [customers, search, sortBy, ascending, customFields]);

  // ---- JSON Export -----------------------------------------------------------
  const onExportJSON = () => {
    const payload = {
      customers,
      exportedAt: new Date().toISOString(),
      customFields,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers_export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- CSV Import/Export (with dry-run preview) ------------------------------
  const [csvPreview, setCsvPreview] = React.useState<CsvPreview | null>(null);
  const [csvModalOpen, setCsvModalOpen] = React.useState(false);
  const csvInputRef = React.useRef<HTMLInputElement | null>(null);

  const [jsonPreview, setJsonPreview] = React.useState<JsonPreview | null>(null);
  const [jsonModalOpen, setJsonModalOpen] = React.useState(false);

  const onImportCsvClick = () => csvInputRef.current?.click();

  const onImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ext = file.name.split(".").pop()?.toLowerCase();
    const delimiter = ext === "tsv" ? "\t" : ",";
    const parsed = parseCSV(text, delimiter);
    if (!parsed.headers.length) {
      alert("CSV appears empty.");
      return;
    }
    const knownKeys = [
      "name",
      "phone",
      "location",
      "signupDate",
      ...customFields.map((f) => f.key),
    ];

    // Map each header in the uploaded file to a known key (or null if unknown)
      const headerToKey = parsed.headers.reduce<Record<string, string | null>>(
        (acc, h) => {
          const normalized = h.trim().toLowerCase();
          const match = knownKeys.find((k) => k.toLowerCase() === normalized);
          acc[h] = match || null;
          return acc;
        },
        {}
      );

    const unmatchedHeaders = Object.entries(headerToKey)
      .filter(([, v]) => !v)
      .map(([h]) => h);

    const addFlags = unmatchedHeaders.reduce<Record<string, boolean>>(
      (acc, h) => {
        acc[h] = true;
        return acc;
      },
      {}
    );

    setCsvPreview({
      headers: parsed.headers,
      rows: parsed.rows,
      headerToKey,
      unmatchedHeaders,
      addFlags,
      errors: [],
    });
    setCsvModalOpen(true);
    if (e.target) e.target.value = "";
  };

  const confirmCsvImport = async () => {
    if (!csvPreview) return;
    try {
      const headerToKey = { ...csvPreview.headerToKey };
      const fieldsToAdd: string[] = [];
      // Add new custom fields if selected
      for (const h of csvPreview.unmatchedHeaders) {
        if (csvPreview.addFlags[h]) {
          const key = toKeySlug(h);
          headerToKey[h] = key;
          fieldsToAdd.push(h);
        }
      }

      if (fieldsToAdd.length > 0) {
        const existing = await getFields();
        let order = existing.length;
        for (const h of fieldsToAdd) {
          const field: CustomField = {
            id: uuid(),
            key: toKeySlug(h),
            label: h,
            type: "text",
            order: order++,
            options: [],
            required: false,
            visibleOn: { dashboard: true, customers: true, campaigns: true },
            archived: false,
          };
          await addField(field);
        }
        // Reload fields to reflect new ones
        const newList = await getFields();
        const all = newList
          .filter((f) => !f.archived && f.visibleOn.customers)
          .sort((a, b) => a.order - b.order);
        setCustomFields(all);
      }

      const mapped = csvPreview.rows.map((row, idx) => {
        const obj: any = { id: uuid(), signupDate: new Date().toISOString() };
        csvPreview.headers.forEach((h, i) => {
          const key = headerToKey[h];
          if (key) obj[key] = row[i];
        });
        if (obj.phone) obj.phone = String(obj.phone).replace(/[^0-9+]/g, "");
        if (!obj.name) obj.name = `Imported #${idx + 1}`;
        return obj;
      });

      const next = [...customers, ...mapped];
      await replaceCustomers(next);
      await reloadCustomers();
      alert(`Imported ${mapped.length} customers.`);
    } catch (e) {
      console.error(e);
      alert("Import failed.");
    } finally {
      setCsvModalOpen(false);
      setCsvPreview(null);
    }
  };

  const exportCSV = () => {
    const cols = ["name", "phone", "location", "signupDate", ...customFields.map((f) => f.key)];
    const header = cols.join(",");
    const lines = customers.map((c) =>
      cols
        .map((k) => {
          const v = (c as any)[k];
          const s = v == null ? "" : String(v).replace(/"/g, '""');
          return /[,\n"]/.test(s) ? `"${s}"` : s;
        })
        .join(",")
    );
    const out = [header, ...lines].join("\n");
    const blob = new Blob([out], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- JSON Import -----------------------------------------------------------
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const onImportClick = () => fileInputRef.current?.click();

  const onImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json.customers)) {
        alert("Invalid file format (missing .customers array).");
        return;
      }
      const knownKeys = [
        "name",
        "phone",
        "location",
        "signupDate",
        ...customFields.map((f) => f.key),
      ];
      const unknown = new Set<string>();
      json.customers.forEach((c: any) => {
        Object.keys(c).forEach((k) => {
          if (!knownKeys.includes(k)) unknown.add(k);
        });
      });
      const addFlags = Array.from(unknown).reduce<Record<string, boolean>>((acc, k) => {
        acc[k] = true;
        return acc;
      }, {});
      setJsonPreview({ customers: json.customers, unknownKeys: Array.from(unknown), addFlags });
      setJsonModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Import failed.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const confirmJsonImport = async () => {
    if (!jsonPreview) return;
    try {
      const fieldsToAdd: string[] = [];
      for (const k of jsonPreview.unknownKeys) {
        if (jsonPreview.addFlags[k]) {
          fieldsToAdd.push(k);
        }
      }
      const headerToKey: Record<string, string> = {};
      if (fieldsToAdd.length > 0) {
        const existing = await getFields();
        let order = existing.length;
        for (const h of fieldsToAdd) {
          const key = toKeySlug(h);
          headerToKey[h] = key;
          const field: CustomField = {
            id: uuid(),
            key,
            label: h,
            type: "text",
            order: order++,
            options: [],
            required: false,
            visibleOn: { dashboard: true, customers: true, campaigns: true },
            archived: false,
          };
          await addField(field);
        }
        const newList = await getFields();
        const all = newList
          .filter((f) => !f.archived && f.visibleOn.customers)
          .sort((a, b) => a.order - b.order);
        setCustomFields(all);
      }

      const mapped = jsonPreview.customers.map((row: any, idx: number) => {
        const obj: any = {
          id: row.id ?? uuid(),
          signupDate: row.signupDate ?? new Date().toISOString(),
        };
        Object.entries(row).forEach(([k, v]) => {
          if (k === "id" || k === "signupDate") return;
          if (jsonPreview.unknownKeys.includes(k) && !jsonPreview.addFlags[k]) return;
          const key = headerToKey[k] ?? k;
          obj[key] = v;
        });
        if (!obj.name) obj.name = `Imported #${idx + 1}`;
        return obj;
      });

      const next = [...customers, ...mapped];
      await replaceCustomers(next);
      await reloadCustomers();
      alert(`Imported ${mapped.length} customers.`);
    } catch (e) {
      console.error(e);
      alert("Import failed.");
    } finally {
      setJsonModalOpen(false);
      setJsonPreview(null);
    }
  };

  // Bulk selection
  const isAllSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(filtered.map((c) => c.id));
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const selectedCustomers = React.useMemo(
    () => customers.filter((c) => selectedIds.includes(c.id)),
    [customers, selectedIds]
  );

  return (
    <PageShell faintFlag>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Customers</h1>
            <p className="text-sm text-gray-600">Full list with dynamic columns and bulk SMS.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onImportClick}
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={onImportJSON}
              className="hidden"
            />

            <button
              onClick={onImportCsvClick}
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Import CSV
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onImportCSV}
              className="hidden"
            />

            <button
              onClick={onExportJSON}
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Export JSON
            </button>

            <button
              onClick={exportCSV}
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Export CSV
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={() => setBulkOpen(true)}
                className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Bulk SMS ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-white rounded-md shadow border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers…"
                className="border rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setAscending((v) => !v)}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
              >
                {ascending ? "▲" : "▼"}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-4 bg-white rounded-md shadow border">
          {loading ? (
            <p className="text-sm text-gray-500">Loading customers…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 w-10">
                      <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
                    </th>
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        className="py-2 cursor-pointer select-none"
                        onClick={() => onSort(c.key)}
                      >
                        {c.label}
                        {sortBy === c.key ? (ascending ? " ▲" : " ▼") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td className="py-6 text-center text-gray-400" colSpan={columns.length + 1}>
                        No results found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggleOne(c.id)}
                          />
                        </td>
                        {columns.map((col) => {
                          const v = (c as any)[col.key];
                          return (
                            <td key={col.key} className="py-2 align-middle">
                              {formatValue(v)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3 text-center">
            Import/export options are only visible on this page.
          </p>
        </div>
      </div>

      <SmsBulkModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        customers={selectedCustomers}
      />

      {csvModalOpen && csvPreview && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">CSV Import Preview</h3>
            {csvPreview.unmatchedHeaders.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded space-y-1">
                <p>Unknown columns detected. Check any you wish to add as custom fields.</p>
                {csvPreview.unmatchedHeaders.map((h) => (
                  <label key={h} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={csvPreview.addFlags[h]}
                      onChange={(e) =>
                        setCsvPreview((prev) =>
                          prev
                            ? { ...prev, addFlags: { ...prev.addFlags, [h]: e.target.checked } }
                            : prev
                        )
                      }
                    />
                    {h}
                  </label>
                ))}
              </div>
            )}
            <div className="max-h-60 overflow-auto border rounded">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    {csvPreview.headers.map((h) => (
                      <th key={h} className="px-2 py-1 border-b text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-sm text-gray-600">
              Previewing first 10 of {csvPreview.rows.length} rows.
            </div>
            <div className="text-sm text-gray-600">
              Successful rows: {csvPreview.rows.length - (csvPreview.errors?.length ?? 0)}
              {(csvPreview.errors?.length ?? 0) > 0 && (
                <> | Failed: {csvPreview.errors?.length ?? 0}</>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setCsvModalOpen(false);
                  setCsvPreview(null);
                }}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmCsvImport}
                className="px-3 py-2 text-sm bg-blue-700 text-white rounded hover:bg-blue-800"
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}

      {jsonModalOpen && jsonPreview && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">JSON Import Preview</h3>
            {jsonPreview.unknownKeys.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded space-y-1">
                <p>Unknown fields detected. Check any you wish to add as custom fields.</p>
                {jsonPreview.unknownKeys.map((k) => (
                  <label key={k} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={jsonPreview.addFlags[k]}
                      onChange={(e) =>
                        setJsonPreview((prev) =>
                          prev
                            ? { ...prev, addFlags: { ...prev.addFlags, [k]: e.target.checked } }
                            : prev
                        )
                      }
                    />
                    {k}
                  </label>
                ))}
              </div>
            )}
            <div className="max-h-60 overflow-auto border rounded text-xs">
              <pre className="p-2 whitespace-pre-wrap">
                {JSON.stringify(jsonPreview.customers.slice(0, 5), null, 2)}
              </pre>
            </div>
            <div className="text-sm text-gray-600">
              Previewing first {Math.min(5, jsonPreview.customers.length)} of{" "}
              {jsonPreview.customers.length} entries.
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setJsonModalOpen(false);
                  setJsonPreview(null);
                }}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmJsonImport}
                className="px-3 py-2 text-sm bg-blue-700 text-white rounded hover:bg-blue-800"
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

// ------------------------------------------

function formatValue(v: AnyValue) {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
