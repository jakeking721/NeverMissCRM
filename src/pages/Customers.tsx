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

import { getFields, CustomField } from "@/services/fieldsService";

type AnyValue = string | number | boolean | null | undefined;
type Customer = SbcCustomer;

// ---- CSV helpers (no external deps) -----------------------------------------
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
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
      } else if (ch === "," && !inQuotes) {
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
  mapped: any[];
  unmatchedHeaders: string[];
  errors: string[];
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

  const onImportCsvClick = () => csvInputRef.current?.click();

  const onImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
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

    // Attempt auto mapping by case-insensitive match of header -> key
    const headerToKey = parsed.headers.reduce<Record<string, string | null>>((acc, h) => {
      const normalized = h.trim().toLowerCase();
      const match = knownKeys.find((k) => k.toLowerCase() === normalized);
      acc[h] = match || null;
      return acc;
    }, {});

    const unmatchedHeaders = Object.entries(headerToKey)
      .filter(([, v]) => !v)
      .map(([h]) => h);

    const errors: string[] = [];
    const mapped = parsed.rows.map((row, idx) => {
      const obj: any = { id: uuid(), signupDate: new Date().toISOString() };
      parsed.headers.forEach((h, i) => {
        const key = headerToKey[h];
        if (key) obj[key] = row[i];
      });
      // naive phone normalization (optional)
      if (obj.phone) obj.phone = String(obj.phone).replace(/[^0-9+]/g, "");
      if (!obj.name) obj.name = `Imported #${idx + 1}`;
      return obj;
    });

    setCsvPreview({
      headers: parsed.headers,
      rows: parsed.rows,
      mapped,
      unmatchedHeaders,
      errors,
    });
    setCsvModalOpen(true);
  };

  const confirmCsvImport = async () => {
    if (!csvPreview) return;
    try {
      const next = [...customers, ...csvPreview.mapped];
      await replaceCustomers(next);
      await reloadCustomers();
      alert("CSV import complete (appended).");
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
      await replaceCustomers(json.customers);
      await reloadCustomers();
      alert("Import complete.");
    } catch (err) {
      console.error(err);
      alert("Import failed.");
    } finally {
      if (e.target) e.target.value = "";
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
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded">
                Unmatched headers: {csvPreview.unmatchedHeaders.join(", ")}. These columns will be
                ignored. (TODO: manual mapping UI)
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
    </PageShell>
  );
}

// ------------------------------------------

function formatValue(v: AnyValue) {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
