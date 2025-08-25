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
import {
  getCustomerColumnPrefs,
  saveCustomerColumnPrefs,
} from "@/services/userService";
import { normalizePhone, formatPhone } from "@/utils/phone";
import { normalizeEmail } from "@/utils/email";
import { getFields, type CustomField, createField } from "@/services/fieldsService";
import { supabase } from "@/utils/supabaseClient";
import { toKeySlug } from "@/utils/slug";
import { JSX } from "react/jsx-runtime";
import type { AnyValue, CsvPreview, JsonPreview } from "@/types/importPreview";
import { FiTarget, FiMove } from "react-icons/fi";

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
  const [zipRadius, _setZipRadius] = useState<{
    zip: string;
    miles: number;
  } | null>(null); // TODO: expose setter via UI for radius filtering

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const dragIndexRef = useRef<number | null>(null);

  const factoryToData: Record<string, string> = useMemo(
    () => ({
      firstName: "f.first_name",
      lastName: "f.last_name",
      phone: "f.phone",
      zipCode: "f.zip_code",
      email: "f.email",
      signupDate: "f.signup_date",
    }),
    [],
  );
  const dataToFactory = useMemo(
    () => Object.fromEntries(Object.entries(factoryToData).map(([k, v]) => [v, k])),
    [factoryToData],
  );

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
          .filter((f) => !f.archived && f.visibleOn?.customers)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
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
      setCustomers(
        await getCustomers({
          search,
          sortBy,
          ascending,
          radiusFilter: zipRadius ?? undefined,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id, search, sortBy, ascending, zipRadius]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  /* --------------------------- Column helpers ---------------------------- */

  const factoryColumns = useMemo(
    () =>
      [
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "phone", label: "Phone" },
        { key: "zipCode", label: "Zip Code" },
        { key: "email", label: "Email" },
        { key: "signupDate", label: "Signup Date" },
      ] as const,
    []
  );

  const allColumns = useMemo(
    () => [...factoryColumns, ...customFields.map((f) => ({ key: f.key, label: f.label }))],
    [factoryColumns, customFields]
  );

  const [visibleCols, setVisibleCols] = useState<string[]>(
    factoryColumns.map((c) => c.key),
  );

  // load persisted column prefs
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const prefs = await getCustomerColumnPrefs();
      if (!prefs || prefs.length === 0) return;
      const idMap = Object.fromEntries(
        customFields.map((f) => [`c.${f.id}`, f.key]),
      );
      const map = { ...dataToFactory, ...idMap } as Record<string, string>;
      const cols = prefs.map((dk) => map[dk]).filter(Boolean);
      if (cols.length) setVisibleCols(cols);
    })();
  }, [user?.id, customFields, dataToFactory]);

  // persist column prefs
  useEffect(() => {
    if (!user?.id) return;
    const keyMap: Record<string, string> = {
      ...factoryToData,
      ...Object.fromEntries(customFields.map((f) => [f.key, `c.${f.id}`])),
    };
    const dataKeys = visibleCols.map((k) => keyMap[k]).filter(Boolean);
    saveCustomerColumnPrefs(dataKeys);
  }, [visibleCols, customFields, factoryToData, user?.id]);

  const columns = useMemo(() => {
    const map = new Map(allColumns.map((c) => [c.key, c]));
    return visibleCols.map((k) => map.get(k)).filter(Boolean) as { key: string; label: string }[];
  }, [visibleCols, allColumns]);

  const toggleColumn = (key: string) => {
    setVisibleCols((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 6) return prev;
      return [...prev, key];
    });
  };

  const moveColumn = (from: number, to: number) => {
    setVisibleCols((cols) => {
      const arr = [...cols];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const onSort = (key: string) => {
    if (sortBy === key) setAscending((v) => !v);
    else {
      setSortBy(key);
      setAscending(true);
    }
  };

  /* ----------------------------- Filter + sort --------------------------- */

  const [pageSize, setPageSize] = useState<number>(() => {
    const stored = localStorage.getItem(`customer-page-size-${user?.id ?? "anon"}`);
    return stored ? Number(stored) : 10;
  });
  const [page, setPage] = useState(1);
  useEffect(() => {
    localStorage.setItem(`customer-page-size-${user?.id ?? "anon"}`, String(pageSize));
  }, [pageSize, user?.id]);
  useEffect(() => setPage(1), [customers.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(customers.length / pageSize));
  const paged = useMemo(
    () => customers.slice((page - 1) * pageSize, page * pageSize),
    [customers, page, pageSize],
  );

  /* ------------------------------ Export JSON ---------------------------- */

  const onExportJSON = () => {
    const rows = customers.map((c) => {
      const obj: Record<string, any> = {};
      columns.forEach((col) => {
        obj[col.key] = (c as Record<string, any>)[col.key];
      });
      return obj;
    });
    const meta = columns.map((c) => ({ key: c.key, label: c.label }));
    const blob = new Blob(
      [
        JSON.stringify(
          { customers: rows, columns: meta, exportedAt: new Date().toISOString() },
          null,
          2,
        ),
      ],
      { type: "application/json" },
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
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "phone", label: "Phone" },
      { key: "zipCode", label: "Zip Code" },
      { key: "email", label: "Email" },
      { key: "signupDate", label: "Signup Date" },
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
          const field: CustomField = {
            id: uuid(),
            user_id: userId,
            key,
            label: h,
            type: "text",
            order: order++,
            options: [],
            required: false,
            visibleOn: { dashboard: true, customers: true, campaigns: true },
            archived: false,
          };
          await createField(field);
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
        if (!obj.firstName && !obj.lastName) obj.firstName = `Imported #${idx + 1}`;
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
          .filter((f) => !f.archived && f.visibleOn?.customers)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
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
        "firstName",
        "lastName",
        "phone",
        "zipCode",
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
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "phone", label: "Phone" },
        { key: "zipCode", label: "Zip Code" },
        { key: "email", label: "Email" },
        { key: "signupDate", label: "Signup Date" },
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
          const field: CustomField = {
            id: uuid(),
            user_id: userId,
            key,
            label: k,
            type: "text",
            order: order++,
            options: [],
            required: false,
            visibleOn: { dashboard: true, customers: true, campaigns: true },
            archived: false,
          };
          await createField(field);
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
        if (!obj.firstName && !obj.lastName) obj.firstName = `Imported`;
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
          .filter((f) => !f.archived && f.visibleOn?.customers)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
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

  const isAllSelected = paged.length > 0 && paged.every((c) => selectedIds.includes(c.id));
  const toggleAll = () => {
    const ids = paged.map((c) => c.id);
    setSelectedIds((prev) =>
      isAllSelected ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])),
    );
  };
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

        {/* search / column controls */}
        <div className="p-4 bg-white rounded-md shadow border space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers…"
              className="border rounded px-3 py-2 text-sm flex-1"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowColumns(true)}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
              >
                Columns
              </button>
              <div className="hidden sm:flex items-center text-xs text-gray-500 gap-1">
                <FiTarget className="w-4 h-4" />
                NEVER MISS FILTERING — COMING SOON!
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm" htmlFor="pageSizeSelect">
                Rows per page:
              </label>
              <select
                id="pageSizeSelect"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <button
                className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`px-2 py-1 text-xs border rounded ${
                    n === page ? "bg-gray-200" : "hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
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
                  {paged.length === 0 ? (
                    <tr>
                      <td className="py-6 text-center text-gray-400" colSpan={columns.length + 1}>
                        No results found.
                      </td>
                    </tr>
                  ) : (
                    paged.map((c) => (
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

      {showColumns && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex"
          onClick={() => setShowColumns(false)}
        >
          <div
            className="bg-white w-72 max-w-full p-4 overflow-y-auto ml-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-2">Columns</h3>
            <ul className="mb-3">
              {visibleCols.map((key, idx) => {
                const col = allColumns.find((c) => c.key === key);
                if (!col) return null;
                return (
                  <li
                    key={key}
                    className="flex items-center gap-2 mb-1"
                    draggable
                    onDragStart={() => (dragIndexRef.current = idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndexRef.current === null) return;
                      moveColumn(dragIndexRef.current, idx);
                      dragIndexRef.current = null;
                    }}
                  >
                    <span
                      className="cursor-move"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" && idx > 0) moveColumn(idx, idx - 1);
                        if (e.key === "ArrowDown" && idx < visibleCols.length - 1)
                          moveColumn(idx, idx + 1);
                      }}
                    >
                      <FiMove />
                    </span>
                    {col.label}
                  </li>
                );
              })}
            </ul>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
              {allColumns.map((c) => {
                const checked = visibleCols.includes(c.key);
                const disabled = !checked && visibleCols.length >= 6;
                return (
                  <label key={c.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleColumn(c.key)}
                    />
                    <span>{c.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* bulk SMS modal */}
      <SmsBulkModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        customers={selectedCustomers as any}
      />

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
  if (Array.isArray(v)) return v.join("; ");
  return String(v);
}
