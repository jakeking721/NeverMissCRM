// src/pages/Dashboard.tsx
// ------------------------------------------------------------------------------------
// Dashboard (Supabase-backed customers)
// - Auto-generates & displays a per-user QR code (via ensure_user_slug RPC)
// - Async customer CRUD via services/customerService.ts (Supabase)
// - Admin credit top-up implemented with creditsService
// ------------------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import PageShell from "@/components/PageShell";
import SmsModal from "@/components/SmsModal";
import { useAuth } from "@/context/AuthContext";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/utils/supabaseClient";
import { creditsService } from "@/services/creditsService";

import {
  getCustomers,
  addCustomer,
  removeCustomer,
  Customer as SbcCustomer,
} from "@/services/customerService";

import { getFields, CustomField, FieldType } from "@/services/fieldsService";

// Allow multiselect to pass string[]
type AnyValue = string | number | boolean | null | undefined | string[];

type Customer = SbcCustomer;

export default function Dashboard() {
  const { user, refresh } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "location" | "signupDate">("signupDate");
  const [ascending, setAscending] = useState(false);

  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsTarget, setSmsTarget] = useState<Customer | null>(null);

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [formState, setFormState] = useState<Record<string, AnyValue>>({
    name: "",
    phone: "",
    location: "",
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
      return (
        (c.name?.toLowerCase?.().includes(s) ?? false) ||
        (c.phone?.toLowerCase?.().includes(s) ?? false) ||
        (c.location?.toLowerCase?.().includes(s) ?? false)
      );
    });

    const compare = (x: any, y: any) => String(x ?? "").localeCompare(String(y ?? ""));

    list.sort((a, b) => {
      if (sortBy === "name") return ascending ? compare(a.name, b.name) : compare(b.name, a.name);
      if (sortBy === "location")
        return ascending ? compare(a.location, b.location) : compare(b.location, a.location);
      return ascending ? compare(a.signupDate, b.signupDate) : compare(b.signupDate, a.signupDate);
    });

    return list.slice(0, 10);
  }, [customers, search, sortBy, ascending]);

  const baseFields = [
    { key: "name", label: "Name", type: "text" as const, required: true },
    { key: "phone", label: "Phone", type: "phone" as const, required: true },
    { key: "location", label: "Location", type: "text" as const, required: false },
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
      name: String(formState.name ?? ""),
      phone: String(formState.phone ?? ""),
      location: String(formState.location ?? ""),
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
        name: "",
        phone: "",
        location: "",
        ...customFields.reduce(
          (acc, f) => {
            acc[f.key] = "";
            return acc;
          },
          {} as Record<string, AnyValue>
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
      refresh();
    } else {
      alert(res.message || "Failed to add credits.");
    }
  };

  const appOrigin =
    import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, "") || window.location.origin;
  const qrValue = slug ? `${appOrigin}/intake/${slug}` : "";

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

        {/* QR Code block */}
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

          {slugLoading ? (
            <p className="text-sm text-gray-500">Generating your link…</p>
          ) : !slug ? (
            <p className="text-sm text-red-600">
              Could not create a public slug for your account. Please try logging out and back in,
              or contact support.
            </p>
          ) : (
            showQr && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-col items-center gap-2">
                  <QRCodeCanvas value={qrValue} size={192} />
                  <div className="text-xs text-gray-500 break-all max-w-[18rem] text-center">
                    {qrValue}
                  </div>
                  <button
                    onClick={copyQrLink}
                    className="px-3 py-1 text-sm rounded border hover:bg-gray-50"
                  >
                    Copy Link
                  </button>
                </div>

                <div className="text-sm text-gray-600 max-w-md">
                  <p className="mb-2">
                    Share this QR code or link to let leads submit directly into your CRM.
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Scan with any phone to open your intake form.</li>
                    <li>
                      URL uses your unique slug: <code>{slug}</code>
                    </li>
                  </ul>
                </div>
              </div>
            )
          )}
        </section>

        {/* Add Contact */}
        <section className="p-4 bg-white rounded-md shadow border">
          <h2 className="text-lg font-medium mb-4">Add Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allFormFields.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={formState[f.key] ?? ""}
                onChange={(v) => onFormChange(f.key, v)}
              />
            ))}
            <div className="md:col-span-3">
              <button
                onClick={onAddCustomer}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </section>

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
                <option value="name">Name</option>
                <option value="location">Location</option>
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
                    <th className="py-2">Name</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Location</th>
                    <th className="py-2">Signup</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">{c.name}</td>
                        <td className="py-2">{c.phone}</td>
                        <td className="py-2">{c.location}</td>
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
                onChange(opts); // <-- AnyValue includes string[]
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
            type={field.type === "number" ? "number" : "text"}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      );
  }
}
