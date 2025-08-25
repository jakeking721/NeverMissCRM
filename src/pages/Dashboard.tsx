// src/pages/Dashboard.tsx
// ------------------------------------------------------------------------------------
// Dashboard (Supabase-backed customers)
// - KPI row (Check-ins, Total Customers, Active Campaigns)
// - Add Contact form
// - Intake QR card with form selector (NEW)
// - Recent Customers with Form/Campaign columns (NEW)
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

  // NEW: intake form selector
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any | null>(null);

  const credits = user?.credits ?? 0;
  const isAdmin = (user?.role ?? "user") === "admin";

  // Fetch fields
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

  // Ensure slug
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
        setSlug((data as any)?.slug ?? null);
      }
      setSlugLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Load customers
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

  // Load forms (NEW)
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase.from("campaign_forms").select("*").eq("user_id", user.id);
      if (!error && data) {
        setForms(data);
        setSelectedForm(data[0] ?? null);
      }
    })();
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
      setFormState({
        firstName: "",
        lastName: "",
        phone: "",
        zipCode: "",
        ...customFields.reduce((acc, f) => {
          acc[f.key] = "";
          return acc;
        }, {} as Record<string, AnyValue>),
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

  const qrValue =
    slug && selectedForm
      ? `${getQrBaseUrl()}/intake/${encodeURIComponent(
          slug,
        )}?form_id=${encodeURIComponent(selectedForm.id)}`
      : "";

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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
            <p className="text-sm text-gray-600">
              Quick stats, credits, your QR intake link, and your latest customers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 bg-white shadow border rounded text-sm">
              Credits: <span className="font-semibold">{credits}</span>
            </div>
            {isAdmin && (
              <button
                onClick={onAdminAddCredits}
                className="px-3 py-2 text-sm rounded-md border bg-blue-600 text-white hover:bg-blue-700"
              >
                Admin: Add Credits
              </button>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-md shadow border">Check-ins Today<br/>—</div>
          <div className="p-4 bg-white rounded-md shadow border">Total Customers<br/>{customers.length}</div>
          <div className="p-4 bg-white rounded-md shadow border">Active Campaigns<br/>—</div>
        </div>

        {/* Add + QR row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Add Contact */}
          <section className="p-4 bg-white rounded-md shadow border">
            <h2 className="text-lg font-medium mb-4">Add Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allFormFields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={formState[f.key] ?? ""}
                  onChange={(v) => onFormChange(f.key, v)}
                />
              ))}
              <div className="md:col-span-2">
                <button
                  onClick={onAddCustomer}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          {/* QR card */}
          <section className="p-4 bg-white rounded-md shadow border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Your Intake QR Code</h2>
              <button
                onClick={() => setShowQr((v) => !v)}
                className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
              >
                {showQr ? "Hide" : "Show"}
              </button>
            </div>

            {/* form selector */}
            <div className="mb-4">
              <label className="text-sm text-gray-700 mr-2">Select intake form:</label>
              <select
                value={selectedForm?.id ?? ""}
                onChange={(e) =>
                  setSelectedForm(forms.find((f) => f.id === e.target.value) ?? null)
                }
                className="border rounded px-2 py-1 text-sm"
              >
                {forms.slice(0, 10).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title || `Form ${f.id}`} (v{f.version})
                  </option>
                ))}
              </select>
              {forms.length > 10 && (
                <button className="ml-2 text-blue-600 text-sm underline">View All</button>
              )}
            </div>

            {slugLoading ? (
              <p className="text-sm text-gray-500">Generating your link…</p>
            ) : !slug || !selectedForm ? (
              <p className="text-sm text-red-600">Select a form to generate your intake QR.</p>
            ) : (
              showQr && (
                <div className="flex flex-col items-center gap-2">
                  <QRCodeCanvas value={qrValue} size={192} />
                  <div className="text-xs text-gray-500 break-all max-w-[18rem] text-center">
                    {qrValue}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyQrLink}
                      className="px-3 py-1 text-sm rounded border hover:bg-gray-50"
                    >
                      Send Link
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1 text-sm rounded border hover:bg-gray-50"
                    >
                      Print QR
                    </button>
                  </div>
                </div>
              )
            )}
          </section>
        </div>

        {/* Recent Customers */}
        <section className="p-4 bg-white rounded-md shadow border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-lg font-medium">Recent Customers</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="border rounded px-3 py-2 text-sm"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <label className="text-sm">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="signupDate">Signup Date</option>
                <option value="firstName">First Name</option>
                <option value="lastName">Last Name</option>
                <option value="zipCode">Zip Code</option>
              </select>
              <button
                onClick={() => setAscending((v) => !v)}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
              >
                {ascending ? "▲" : "▼"}
              </button>
            </div>
          </div>
          {loadingCustomers ? (
            <p className="text-sm text-gray-500">Loading customers…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">First Name</th>
                    <th className="py-2">Last Name</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Form</th>
                    <th className="py-2">Campaign</th>
                    <th className="py-2">Signup</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-gray-500">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">{c.firstName}</td>
                        <td className="py-2">{c.lastName}</td>
                        <td className="py-2">{formatPhone(c.phone)}</td>
                        <td className="py-2">{(c as any).form_name || "-"}</td>
                        <td className="py-2">{(c as any).campaign_name || "-"}</td>
                        <td className="py-2">{new Date(c.signupDate).toLocaleDateString()}</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => onOpenSms(c)}
                            className="text-blue-600 hover:underline"
                          >
                            SMS
                          </button>
                          <button
                            onClick={() => onRemove(c.id)}
                            className="ml-2 text-red-600 hover:underline"
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

type FieldInputProps = {
  field: { key: string; label: string; type: FieldType; required?: boolean; options?: string[] };
  value: AnyValue;
  onChange: (v: AnyValue) => void;
};

function FieldInput({ field, value, onChange }: FieldInputProps) {
  switch (field.type) {
    case "boolean":
      return (
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          {field.label} {field.required ? "*" : ""}
        </label>
      );
    case "select":
    case "multiselect":
      return (
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">
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
                onChange(opts);
              } else {
                onChange(e.target.value);
              }
            }}
            className="border rounded px-2 py-1"
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
          <label className="text-sm font-medium mb-1">
            {field.label} {field.required ? "*" : ""}
          </label>
          <input
            type={field.type === "number" ? "number" : field.type === "phone" ? "tel" : "text"}
            value={field.type === "phone" ? formatPhone(String(value ?? "")) : String(value ?? "")}
            onChange={(e) =>
              onChange(field.type === "phone" ? normalizePhone(e.target.value) : e.target.value)
            }
            className="border rounded px-2 py-1"
          />
        </div>
      );
  }
}
