/* -------------------------------------------------------------------------- */
/*  src/pages/Customers.tsx – customer list with bulk SMS & CSV / JSON import */
/* -------------------------------------------------------------------------- */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";

import PageShell from "@/components/PageShell";
import SmsBulkModal from "@/components/SmsBulkModal";
import CsvPreviewModal from "@/components/CsvPreviewModal";
import JsonPreviewModal from "@/components/JsonPreviewModal";
import CustomerEditModal from "@/components/CustomerEditModal";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

import {
  getCustomers,
  upsertCustomers,
  removeCustomer,
  updateCustomer,
  type Customer as SbcCustomer,
  type DedupeOptions,
  type OverwritePolicy,
} from "@/services/customerService";
import { normalizePhone, formatPhone } from "@/utils/phone";
import { normalizeEmail } from "@/utils/email";
import { getFields, type CustomField } from "@/services/fieldsService";
import { supabase } from "@/utils/supabaseClient";
import type { TablesInsert } from "@/types/supabase";
import { toKeySlug } from "@/utils/slug";
import { JSX } from "react/jsx-runtime";
import type { AnyValue, CsvPreview, JsonPreview } from "@/types/importPreview";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Customer = SbcCustomer;

/* -------------------------------------------------------------------------- */
/*                              CSV helper (vanilla)                          */
/* -------------------------------------------------------------------------- */

function parseCSV(
  text: string,
  delimiter = ","
): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i += 1;
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
    .filter((r) => r.some((v) => v));

  return { headers, rows };
}

/* -------------------------------------------------------------------------- */
/*                               Component                                    */
/* -------------------------------------------------------------------------- */

export default function Customers(): JSX.Element {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  /* ----------------------------- Local state ----------------------------- */

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("signupDate");
  const [ascending, setAscending] = useState(false);

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  /* ---------------------------- Meta (fetch) ----------------------------- */

useEffect(() => {
   if (!ready) return;
   if (!user) navigate("/login");
 }, [ready, user, navigate]);
  /** refresh field meta */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await getFields();
      if (cancelled) return;

      setCustomFields(
        list
          .filter((f) => !f.archived && f.visibleOn.customers)
          .sort((a, b) => a.order - b.order)
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /** load customers */
  const loadCustomers = useCallback(async () => {
    if (!user?.id) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setCustomers(await getCustomers());
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  /* --------------------------- Column helpers ---------------------------- */

  const baseColumns = useMemo(
    () =>
      [
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "location", label: "Location" },
        { key: "signupDate", label: "Signup" },
      ] as const,
    []
  );

  const columns = useMemo(
    () => [...baseColumns, ...customFields.map((f) => ({ key: f.key, label: f.label }))],
    [baseColumns, customFields]
  );

  const onSort = (key: string) => {
    if (sortBy === key) setAscending((v) => !v);
    else {
      setSortBy(key);
      setAscending(true);
    }
  };

  /* ----------------------------- Filter + sort --------------------------- */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const matches = (c: Customer): boolean => {
      if (!q) return true;
      const baseHit =
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.signupDate?.toLowerCase().includes(q);

      if (baseHit) return true;

      return customFields.some((f) => {
        const v = (c as Record<string, AnyValue>)[f.key];
        return (
          (typeof v === "string" && v.toLowerCase().includes(q)) ||
          (typeof v === "number" && String(v).includes(q))
        );
      });
    };

    const list = customers.filter(matches);

    return list.sort((a, b) => {
      const av = (a as Record<string, AnyValue>)[sortBy];
      const bv = (b as Record<string, AnyValue>)[sortBy];

      if (av == null || bv == null) return av == null ? (ascending ? -1 : 1) : ascending ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number")
        return ascending ? av - bv : bv - av;

      return ascending
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [customers, search, sortBy, ascending, customFields]);

  /* ------------------------------ Export JSON ---------------------------- */

  const onExportJSON = () => {
    const formatted = customers.map((c) => {
      const obj: Record<string, AnyValue> = {};
      Object.entries(c).forEach(([k, v]) => {
        obj[k] = formatValue(v);
      });
      return obj;
    });
    const blob = new Blob(
      [
        JSON.stringify(
          { customers: formatted, exportedAt: new Date().toISOString(), customFields },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "customers_export.json",
    });
    a.click();
    URL.revokeObjectURL(url);
  };

    /** Export table as CSV */
  const onExportCSV = () => {
    const headers = columns.map((c) => c.label);
    const rows = customers.map((c) =>
      columns
        .map((col) => {
          const raw = formatValue((c as Record<string, AnyValue>)[col.key]);
          // escape double quotes by doubling them
          const escaped = raw.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "customers_export.csv",
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ------------------------- CSV / JSON import UI ------------------------ */

  /** CSV preview modal */
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  /** JSON preview modal */
  const [jsonPreview, setJsonPreview] = useState<JsonPreview | null>(null);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const onImportCsvClick = async () => {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        alert("You must be logged in.");
        return;
      }
      csvInputRef.current?.click();
    } finally {
      setBusy(false);
    }
  };
  const onImportJsonClick = async () => {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        alert("You must be logged in.");
        return;
      }
      jsonInputRef.current?.click();
    } finally {
      setBusy(false);
    }
  };

  /* ----------------------------- CSV handler ----------------------------- */

  const onImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        alert("You must be logged in.");
        return;
      }
      const file = e.target.files?.[0];
      if (!file) return;

      const delimiter = file.name.toLowerCase().endsWith(".tsv") ? "\t" : ",";
      const { headers, rows } = parseCSV(await file.text(), delimiter);
      if (headers.length === 0) {
        toast.error("CSV appears empty.");
        return;
      }

    const fieldOptions = [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "location", label: "Location" },
      { key: "signupDate", label: "Signup" },
      ...customFields.map((f) => ({ key: f.key, label: f.label })),
    ];

    const normalize = (s: string) => toKeySlug(s).replace(/[-_]/g, "");
    const slugToKey: Record<string, string> = {};
    fieldOptions.forEach((opt) => {
      slugToKey[normalize(opt.label)] = opt.key;
    });

    const columns: Record<string, { addNew: boolean; linkTo: string | null }> = {};
    headers.forEach((h) => {
      const matchKey = slugToKey[normalize(h)] ?? null;
      columns[h] = { addNew: !matchKey, linkTo: matchKey };
    });

      setCsvPreview({
        headers,
        rows,
        columns,
        fieldOptions,
      });
      setCsvModalOpen(true);
    } finally {
      e.target.value = "";
      setBusy(false);
    }
  };

  const confirmCsvImport = async (
    userId: string,
    columns: Record<string, { addNew: boolean; linkTo: string | null }>,
    dedupe: DedupeOptions,
    overwrite: OverwritePolicy,
  ) => {
    if (!csvPreview) return;
    try {
      let order = customFields.length;
      const mapping: Record<string, string> = {};

      for (const h of csvPreview.headers) {
        const col = columns[h];
        if (!col) continue;
        if (col.linkTo) {
          mapping[h] = col.linkTo;
          continue;
        }
        if (col.addNew) {
          const key = toKeySlug(h);
          mapping[h] = key;
          const field: TablesInsert<'custom_fields'> = {
            id: uuid(),
            user_id: userId,
            key,
            label: h,
            type: "text",
            order: order++,
            options: [],
            required: false,
            visible_on: { dashboard: true, customers: true, campaigns: true },
            archived: false,
          };
          await supabase.from('custom_fields').insert(field);
        }
      }

      const mapped: Customer[] = [];
      const failures: { row: string[]; reason: string }[] = [];
      csvPreview.rows.forEach((row, idx) => {
        const obj: Record<string, AnyValue> = {
          id: uuid(),
          user_id: userId,
          signupDate: new Date().toISOString(),
        };
        csvPreview.headers.forEach((h, i) => {
          const key = mapping[h];
          if (key) obj[key] = row[i];
        });
        if (!obj.name) obj.name = `Imported #${idx + 1}`;
        const normPhone = normalizePhone(obj.phone);
        const normEmail = normalizeEmail(obj.email);
        if ((obj.phone && !normPhone) || (obj.email && !normEmail)) {
          failures.push({ row, reason: "invalid" });
          return;
        }
        obj.phone = normPhone || null;
        obj.email = normEmail || null;
        mapped.push(obj as Customer);
      });

      const summary = await upsertCustomers(mapped, dedupe, overwrite);
      const list = await getFields();
      setCustomFields(
        list
          .filter((f) => !f.archived && f.visibleOn.customers)
          .sort((a, b) => a.order - b.order),
      );
      await loadCustomers();

      setCsvModalOpen(false);
      setCsvPreview(null);
      const invalid = failures.length;
      toast.success(
        `Created ${summary.created}, Updated ${summary.updated}, Skipped ${summary.skipped}, Invalid ${invalid}.`,
      );
      const allFailures = [
        ...failures,
        ...summary.failures.map((f) => ({
          row: csvPreview.headers.map((h) => String((f.customer as any)[h] ?? "")),
          reason: f.reason,
        })),
      ];
      if (allFailures.length > 0) {
        const csv = [
          [...csvPreview.headers, "reason"].join(","),
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
    } catch (err: any) {
      console.error(err);
      toast.error(`Import failed: ${err?.message ?? err}`);
    }
  };

  /* ----------------------------- JSON handler ---------------------------- */

  const onImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        alert("You must be logged in.");
        return;
      }
      const file = e.target.files?.[0];
      if (!file) return;
      const json = JSON.parse(await file.text());
      if (!Array.isArray(json.customers)) throw new Error("Missing .customers array");

      const knownKeys = [
        "name",
        "phone",
        "location",
        "signupDate",
        "email",
        ...customFields.map((f) => f.key),
      ];
      const unknown = new Set<string>();
      json.customers.forEach((c: Record<string, AnyValue>) =>
        Object.keys(c).forEach((k) => {
          if (!knownKeys.includes(k)) unknown.add(k);
        })
      );

      const fieldOptions = [
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "location", label: "Location" },
        { key: "signupDate", label: "Signup" },
        ...customFields.map((f) => ({ key: f.key, label: f.label })),
      ];
      const unknownArr = Array.from(unknown);
      setJsonPreview({
        customers: json.customers,
        unknownKeys: unknownArr,
        addFlags: Object.fromEntries(unknownArr.map((k) => [k, true])),
        keyToField: Object.fromEntries(unknownArr.map((k) => [k, null])),
        fieldOptions,
      });
      setJsonModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Import failed.");
    } finally {
      e.target.value = "";
      setBusy(false);
    }
  };

  const confirmJsonImport = async (
    userId: string,
    opts: { addFlags: Record<string, boolean>; keyToField: Record<string, string | null> },
    dedupe: DedupeOptions,
    overwrite: OverwritePolicy,
  ) => {
    if (!jsonPreview) return;
    try {
      const mapping: Record<string, string> = {};
      let order = customFields.length;

      for (const k of jsonPreview.unknownKeys) {
        const selected = opts.keyToField[k];
        if (selected) {
          mapping[k] = selected;
          continue;
        }
        if (opts.addFlags[k]) {
          const key = toKeySlug(k);
          mapping[k] = key;
          const field: TablesInsert<'custom_fields'> = {
            id: uuid(),
            user_id: userId,
            key,
            label: k,
            type: "text",
            order: order++,
            options: [],
            required: false,
            visible_on: { dashboard: true, customers: true, campaigns: true },
            archived: false,
          };
          await supabase.from('custom_fields').insert(field);
        }
      }

      const mapped: Customer[] = [];
      const failures: { row: Record<string, any>; reason: string }[] = [];
      jsonPreview.customers.forEach((row) => {
        const obj: Record<string, AnyValue> = {
          id: (row as any).id ?? uuid(),
          user_id: userId,
          signupDate: (row as any).signupDate ?? new Date().toISOString(),
        };
        Object.entries(row).forEach(([k, v]) => {
          if (k === "id" || k === "signupDate") return;
          if (jsonPreview.unknownKeys.includes(k)) {
            const key = mapping[k];
            if (key) obj[key] = v;
          } else {
            obj[k] = v;
          }
        });
        if (!obj.name) obj.name = `Imported`;
        const normPhone = normalizePhone(obj.phone);
        const normEmail = normalizeEmail(obj.email);
        if ((obj.phone && !normPhone) || (obj.email && !normEmail)) {
          failures.push({ row, reason: "invalid" });
          return;
        }
        obj.phone = normPhone || null;
        obj.email = normEmail || null;
        mapped.push(obj as Customer);
      });

      const summary = await upsertCustomers(mapped, dedupe, overwrite);
      const list = await getFields();
      setCustomFields(
        list
          .filter((f) => !f.archived && f.visibleOn.customers)
          .sort((a, b) => a.order - b.order),
      );
      await loadCustomers();

      setJsonModalOpen(false);
      setJsonPreview(null);
      const invalid = failures.length;
      toast.success(
        `Created ${summary.created}, Updated ${summary.updated}, Skipped ${summary.skipped}, Invalid ${invalid}.`,
      );
      const headers = Object.keys(jsonPreview.customers[0] || {});
      const allFailures = [
        ...failures.map((f) => ({ row: headers.map((h) => String((f.row as any)[h] ?? "")), reason: f.reason })),
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
    } catch (err) {
      console.error(err);
      toast.error("Import failed.");
    }
  };

  /* --------------------------- Selection helpers ------------------------- */

  const isAllSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleAll = () =>
    setSelectedIds(isAllSelected ? [] : filtered.map((c) => c.id));
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedCustomers = useMemo(
    () => customers.filter((c) => selectedIds.includes(c.id)),
    [customers, selectedIds]
  );

  const onEditSelected = () => setEditOpen(true);

  const onDeleteSelected = useCallback(async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.length} selected customer${selectedIds.length === 1 ? "" : "s"}?`,
      )
    )
      return;
    setBusy(true);
    try {
      await Promise.all(selectedIds.map((id) => removeCustomer(id)));
      toast.success("Deleted selected customers.");
      setSelectedIds([]);
      await loadCustomers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete customers.");
    } finally {
      setBusy(false);
    }
  }, [selectedIds, loadCustomers]);

  const onSaveEdit = async (patch: Partial<Customer>) => {
    setBusy(true);
    try {
      await Promise.all(selectedIds.map((id) => updateCustomer(id, patch)));
      toast.success("Customers updated.");
      setEditOpen(false);
      setSelectedIds([]);
      await loadCustomers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update customers.");
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------ Renderer ------------------------------- */

  return (
    <PageShell faintFlag>
      {/* header / action bar */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Customers</h1>
            <p className="text-sm text-gray-600">
              Full list with dynamic columns and bulk SMS.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2">
            {/* import / export buttons */}
            <button onClick={onImportJsonClick} className="btn" disabled={busy}>
              Import JSON
            </button>
            <input
              ref={jsonInputRef}
              type="file"
              accept="application/json"
              onChange={onImportJSON}
              hidden
            />

            <button onClick={onImportCsvClick} className="btn" disabled={busy}>
              Import CSV
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onImportCSV}
              hidden
            />

            <button onClick={onExportJSON} className="btn">
              Export JSON
            </button>
            <button onClick={onExportCSV} className="btn">
              Export CSV
            </button>

            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={onEditSelected}
                  className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Edit Selected
                </button>
                <button
                  onClick={onDeleteSelected}
                  className="px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setBulkOpen(true)}
                  className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Bulk SMS ({selectedIds.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* search / sort controls */}
        <div className="p-4 bg-white rounded-md shadow border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers…"
              className="border rounded px-3 py-2 text-sm"
            />

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
              <button onClick={() => setAscending((v) => !v)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">
                {ascending ? "▲" : "▼"}
              </button>
            </div>
          </div>
        </div>

        {/* table */}
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
                        {sortBy === c.key && (ascending ? " ▲" : " ▼")}
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
                      <tr
                        key={c.id}
                        className="border-b hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                        onClick={() => navigate(`/customers/${c.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") navigate(`/customers/${c.id}`);
                        }}
                      >
                        <td className="py-2 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggleOne(c.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        {columns.map((col) => (
                          <td key={col.key} className="py-2 align-middle">
                            {formatValue((c as Record<string, AnyValue>)[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3 text-center">
            Import / export options are only visible on this page.
          </p>
        </div>
      </div>

      {/* bulk SMS modal */}
      <SmsBulkModal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} customers={selectedCustomers} />

      {/* bulk edit modal */}
      <CustomerEditModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        customers={selectedCustomers}
        customFields={customFields}
        onSave={onSaveEdit}
      />

      {/* ---------- CSV preview modal ---------- */}
      {csvModalOpen && csvPreview && (
        <CsvPreviewModal
          preview={csvPreview}
          onCancel={() => {
            setCsvModalOpen(false);
            setCsvPreview(null);
          }}
          onConfirm={confirmCsvImport}
          busy={busy}
          setBusy={setBusy}
          canConfirm={true}
        />
      )}

      {/* ---------- JSON preview modal ---------- */}
      {jsonModalOpen && jsonPreview && (
        <JsonPreviewModal
          preview={jsonPreview}
          onCancel={() => {
            setJsonModalOpen(false);
            setJsonPreview(null);
          }}
          onConfirm={confirmJsonImport}
          busy={busy}
          setBusy={setBusy}
          canConfirm={true}
        />
      )}
    </PageShell>
  );
}

/* -------------------------------------------------------------------------- */
/* ----------------------------- Util helpers ------------------------------ */

function formatValue(v: AnyValue): string {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return new Intl.NumberFormat().format(v);
  if (typeof v === "string" && /^\+?\d{10,15}$/.test(v)) return formatPhone(v);
  return String(v);
}
