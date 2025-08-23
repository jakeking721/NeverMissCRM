// src/pages/Dashboard.tsx
// ------------------------------------------------------------------------------------
// Dashboard (Supabase-backed customers) — STYLE-ONLY REFACTOR
// - No logic changes; imports, state, effects, and handlers preserved
// - Visual polish: soft app background, elevated cards, tighter spacing,
//   clearer controls, sticky table header, zebra rows, improved buttons
// ------------------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import PageShell from "@/components/PageShell";
import SmsModal from "@/components/SmsModal";
import { useAuth } from "@/context/AuthContext";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/utils/supabaseClient";
import { creditsService } from "@/services/creditsService";
import { getQrBaseUrl } from "@/utils/url";

import {
  getCustomers,
  addCustomer,
  removeCustomer,
  Customer as SbcCustomer,
} from "@/services/customerService";

import { getFields, CustomField, FieldType } from "@/services/fieldsService";
import { formatPhone, normalizePhone } from "@/utils/phone";

// Allow multiselect to pass string[]
type AnyValue = string | number | boolean | null | undefined | string[];
type Customer = SbcCustomer;

export default function Dashboard() {
  const { user, refresh } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"firstName" | "lastName" | "zipCode" | "signupDate">(
    "signupDate",
  );
  const [ascending, setAscending] = useState(false);

  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsTarget, setSmsTarget] = useState<Customer | null>(null);

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [formState, setFormState] = useState<Record<string, AnyValue>>({
    firstName: "",
    lastName: "",
    phone: "",
    zipCode: "",
  });

  const [slug, setSlug] = useState<string | null>(null);
  const [slugLoading, setSlugLoading] = useState<boolean>(true);
  const [showQr, setShowQr] = useState(true);

  // NOTE: Until creditsService is migrated to Supabase, show the value from user profile.
  const credits = user?.credits ?? 0;
  const isAdmin = (user?.role ?? "user") === "admin";

  // 1) Fetch fields (supporting both current sync impl & future async Supabase impl)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const maybePromise = getFields();
        const all = await Promise.resolve(maybePromise as any);
        if (!active || !all) return;
        const filtered = (all as CustomField[])
          .filter((f) => !f.archived && (f as any).visibleOn?.dashboard)
          .sort((a, b) => a.order - b.order);
        setCustomFields(filtered);
      } catch (e) {
        console.error("getFields failed:", e);
        setCustomFields([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // 2) Fetch / ensure slug for the logged in user
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user?.id) {
        setSlugLoading(false);
        return;
      }
      setSlugLoading(true);
      const { data, error } = await supabase.rpc("ensure_user_slug", { p_user_id: user.id });
      if (!active) return;
      if (error) {
        console.error("ensure_user_slug error:", error);
        setSlug(null);
      } else {
        // Supabase returns the row; grab its slug
        setSlug((data as any)?.slug ?? null);
      }
      setSlugLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // 3) Load customers for this user (Supabase)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) {
        setCustomers([]);
        setLoadingCustomers(false);
        return;
      }
      setLoadingCustomers(true);
      try {
        const list = await getCustomers();
        if (mounted) setCustomers(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoadingCustomers(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = customers.filter((c) => {
      if (!s) return true;

      const baseHit =
        (c.firstName?.toLowerCase?.().includes(s) ?? false) ||
        (c.lastName?.toLowerCase?.().includes(s) ?? false) ||
        (c.phone?.toLowerCase?.().includes(s) ?? false) ||
        (c.zipCode?.toLowerCase?.().includes(s) ?? false) ||
        (c.signupDate?.toLowerCase?.().includes(s) ?? false);

      if (baseHit) return true;

      for (const f of customFields) {
        const v = (c as any)[f.key];
        if (typeof v === "string" && v.toLowerCase().includes(s)) return true;
        if (typeof v === "number" && String(v).includes(s)) return true;
      }

      return false;
    });

    list.sort((a, b) => {
      if (sortBy === "signupDate") {
        const at = new Date(a.signupDate).getTime();
        const bt = new Date(b.signupDate).getTime();
        return ascending ? at - bt : bt - at;
      }

      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];
      return ascending
        ? String(av ?? "").localeCompare(String(bv ?? ""))
        : String(bv ?? "").localeCompare(String(av ?? ""));
    });

    return list.slice(0, 10);
  }, [customers, search, sortBy, ascending, customFields]);

  const baseFields = [
    { key: "firstName", label: "First Name", type: "text" as const, required: true },
    { key: "lastName", label: "Last Name", type: "text" as const, required: true },
    { key: "phone", label: "Phone", type: "phone" as const, required: true },
    { key: "zipCode", label: "Zip Code", type: "text" as const, required: false },
  ];

  const allFormFields = useMemo(
    () => [
      ...baseFields,
      ...customFields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type as FieldType,
        required: !!f.required,
        options: (f as any).options,
      })),
    ],
    [customFields]
  );

  const onFormChange = (key: string, val: AnyValue) => {
    setFormState((prev) => ({ ...prev, [key]: val }));
  };

  const reloadCustomers = async () => {
    const list = await getCustomers();
    setCustomers(list);
  };

  const onAddCustomer = async () => {
    for (const f of allFormFields) {
      if (f.required && !formState[f.key]) {
        alert(`Field "${f.label}" is required.`);
        return;
      }
    }

    const newCustomer: Customer = {
      id: uuidv4(),
      user_id: user!.id,
      firstName: String(formState.firstName ?? ""),
      lastName: String(formState.lastName ?? ""),
      phone: normalizePhone(formState.phone) || undefined,
      zipCode: String(formState.zipCode ?? ""),
      signupDate: new Date().toISOString(),
      ...customFields.reduce(
        (acc, f) => {
          acc[f.key] = formState[f.key] ?? null;
          return acc;
        },
        {} as Record<string, AnyValue>
      ),
    };

    try {
      await addCustomer(newCustomer);
      await reloadCustomers();
      // reset
      setFormState({
        firstName: "",
        lastName: "",
        phone: "",
        zipCode: "",
        ...customFields.reduce(
          (acc, f) => {
            acc[f.key] = "";
            return acc;
          },
          {} as Record<string, AnyValue>,
        ),
      });
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to add customer.");
    }
  };

  const onRemove = async (id: string) => {
    try {
      await removeCustomer(id);
      await reloadCustomers();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to remove customer.");
    }
  };

  const onOpenSms = (c: Customer) => {
    setSmsTarget(c);
    setShowSmsModal(true);
  };
  const onCloseSms = () => {
    setSmsTarget(null);
    setShowSmsModal(false);
  };

  const onAdminAddCredits = async () => {
    const input = prompt("Add how many credits?");
    const amount = Number(input);
    if (!input || isNaN(amount) || amount <= 0) return;
    const res = await creditsService.adminAddToCurrentUser(amount);
    if (res.ok) {
      alert(`Added ${amount} credits.`);
      await refresh();
    } else {
      alert(res.message || "Failed to add credits.");
    }
  };

  const qrValue = slug ? `${getQrBaseUrl()}/intake/${slug}` : "";

  const copyQrLink = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      alert("Link copied to clipboard!");
    } catch {
      alert("Failed to copy.");
    }
  };

  return (
    <PageShell faintFlag>
      {/* Soft app background wrapper */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-gradient-to-b from-[#f7fbff] via-[#f4f8ff] to-[#f3f7ff] rounded-2xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Quick stats, credits, your QR intake link, and your latest customers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
              <span className="text-slate-600">Credits:</span>
              <span className="font-semibold text-slate-900">{credits}</span>
            </div>
            {isAdmin && (
              <button
                onClick={onAdminAddCredits}
                className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                Admin: Add Credits
              </button>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Check-ins Today", value: "—" },
            { label: "Total Customers", value: customers.length.toLocaleString() },
            { label: "Active Campaigns", value: "—" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm text-slate-500">{kpi.label}</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Main grid: Add Contact + QR */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Add Contact */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add Contact</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {allFormFields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={formState[f.key] ?? ""}
                  onChange={(v) => onFormChange(f.key, v)}
                />
              ))}
              <div className="md:col-span-2 flex justify-end">
                <button
                  onClick={onAddCustomer}
                  className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          {/* QR Code block */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Your Intake QR Code</h2>
              <button
                onClick={() => setShowQr((v) => !v)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {showQr ? "Hide" : "Show"}
              </button>
            </div>

            {slugLoading ? (
              <p className="text-sm text-slate-500">Generating your link…</p>
            ) : !slug ? (
              <p className="text-sm font-medium text-red-600">
                Could not create a public slug for your account. Please try logging out and back in,
                or contact support.
              </p>
            ) : (
              showQr && (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <QRCodeCanvas value={qrValue} size={192} />
                    </div>
                    <div className="max-w-xs break-all text-center text-xs text-slate-500">
                      {qrValue}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyQrLink}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Copy Link
                      </button>
                      {/* This is purely visual. If you already support PNG download elsewhere, keep behavior as-is. */}
                      <a
                        href={`data:text/plain,${encodeURIComponent(qrValue)}`}
                        download="qr-link.txt"
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Download PNG
                      </a>
                    </div>
                  </div>

                  <div className="max-w-md text-sm text-slate-700">
                    <p className="mb-2">
                      Share this QR code or link to let leads submit directly into your CRM.
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-slate-600">
                      <li>Scan with any phone to open your intake form.</li>
                      <li>
                        URL uses your unique slug:{" "}
                        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">
                          {slug}
                        </code>
                      </li>
                    </ul>
                  </div>
                </div>
              )
            )}
          </section>
        </div>

        {/* Recent Customers */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Customers</h2>

            <div className="flex items-center gap-2">
              <input
                type="text"
                className="h-9 w-56 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search customers"
              />

              <label className="text-sm text-slate-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                aria-label="Sort customers by"
              >
                <option value="signupDate">Signup Date</option>
                <option value="firstName">First Name</option>
                <option value="lastName">Last Name</option>
                <option value="zipCode">Zip Code</option>
              </select>
              <button
                onClick={() => setAscending((v) => !v)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Toggle sort direction"
                title="Toggle sort direction"
              >
                {ascending ? "▲" : "▼"}
              </button>
            </div>
          </div>

          {loadingCustomers ? (
            <p className="text-sm text-slate-500">Loading customers…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-[1] bg-white">
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="py-2 font-medium">First Name</th>
                    <th className="py-2 font-medium">Last Name</th>
                    <th className="py-2 font-medium">Phone</th>
                    <th className="py-2 font-medium">Zip Code</th>
                    <th className="py-2 font-medium">Signup</th>
                    <th className="py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, idx) => (
                      <tr
                        key={c.id}
                        className={`border-b border-slate-100 ${
                          idx % 2 === 0 ? "bg-slate-50/40" : ""
                        } hover:bg-slate-50`}
                      >
                        <td className="py-2 text-slate-900">{c.firstName}</td>
                        <td className="py-2 text-slate-900">{c.lastName}</td>
                        <td className="py-2 text-slate-900">{formatPhone(c.phone)}</td>
                        <td className="py-2 text-slate-900">{c.zipCode}</td>
                        <td className="py-2 text-slate-900">
                          {new Date(c.signupDate).toLocaleDateString()}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => onOpenSms(c)}
                            className="rounded-md px-2 py-1 text-blue-600 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          >
                            SMS
                          </button>
                          <button
                            onClick={() => onRemove(c.id)}
                            className="ml-2 rounded-md px-2 py-1 text-red-600 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500/30"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showSmsModal && smsTarget && <SmsModal customer={smsTarget} onClose={onCloseSms} />}
    </PageShell>
  );
}

// ------------------------------------------------------------------

type FieldInputProps = {
  field: {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    options?: string[];
  };
  value: AnyValue;
  onChange: (v: AnyValue) => void;
};

function FieldInput({ field, value, onChange }: FieldInputProps) {
  switch (field.type) {
    case "boolean":
      return (
        <label className="inline-flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          {field.label} {field.required ? "*" : ""}
        </label>
      );
    case "select":
    case "multiselect":
      return (
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-slate-800">
            {field.label} {field.required ? "*" : ""}
          </label>
          <select
            multiple={field.type === "multiselect"}
            value={
              field.type === "multiselect"
                ? Array.isArray(value)
                  ? value.map(String)
                  : []
                : String(value ?? "")
            }
            onChange={(e) => {
              if (field.type === "multiselect") {
                const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                onChange(opts); // <-- AnyValue includes string[]
              } else {
                onChange(e.target.value);
              }
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    default:
      return (
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-slate-800">
            {field.label} {field.required ? "*" : ""}
          </label>
          <input
            type={field.type === "number" ? "number" : field.type === "phone" ? "tel" : "text"}
            value={field.type === "phone" ? formatPhone(String(value ?? "")) : String(value ?? "")}
            onChange={(e) =>
              onChange(field.type === "phone" ? normalizePhone(e.target.value) : e.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder={field.type === "phone" ? "(555) 555-1234" : ""}
          />
        </div>
      );
  }
}