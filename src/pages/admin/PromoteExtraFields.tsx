// src/pages/admin/PromoteExtraFields.tsx
// -----------------------------------------------------------------------------
// Admin tool to promote keys in customers.extra to real custom fields
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import PageShell from "@/components/PageShell";
import { supabase } from "@/utils/supabaseClient";
import { addField, type CustomField } from "@/services/fieldsService";
import { upsertFieldValues } from "@/services/fieldValuesService";

interface ExtraInfo {
  key: string;
  rows: { customerId: string; value: any }[];
  type: CustomField["type"];
  options: string[];
}

const FIELD_TYPES: CustomField["type"][] = [
  "text",
  "number",
  "date",
  "email",
  "phone",
  "boolean",
  "select",
  "multiselect",
];

export default function PromoteExtraFields() {
  const [extras, setExtras] = useState<ExtraInfo[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("customers").select("id,extra");
      const map: Record<string, { customerId: string; value: any }[]> = {};
      for (const row of data ?? []) {
        const extra = row.extra || {};
        for (const [k, v] of Object.entries(extra)) {
          if (!map[k]) map[k] = [];
          map[k].push({ customerId: row.id, value: v });
        }
      }
      const arr: ExtraInfo[] = Object.keys(map).map((k) => ({
        key: k,
        rows: map[k],
        type: "text",
        options: [],
      }));
      setExtras(arr);
    })();
  }, []);

  const promote = async (info: ExtraInfo) => {
    const fieldId = uuid();
    await addField({
      id: fieldId,
      key: info.key,
      label: info.key,
      type: info.type,
      options: info.options,
      order: 0,
      visibleOn: { dashboard: false, customers: true, campaigns: false },
    });
    for (const r of info.rows) {
      await upsertFieldValues(r.customerId, { [info.key]: String(r.value ?? "") });
      const { data } = await supabase
        .from("customers")
        .select("extra")
        .eq("id", r.customerId)
        .single();
      const { [info.key]: _, ...rest } = data?.extra ?? {};
      await supabase.from("customers").update({ extra: rest }).eq("id", r.customerId);
    }
    setExtras((prev) => prev.filter((e) => e.key !== info.key));
  };

  return (
    <PageShell faintFlag>
      <div className="max-w-3xl mx-auto pt-12 px-4 pb-10">
        <h1 className="text-2xl font-bold mb-6">Promote Extra Fields</h1>
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {extras.length === 0 && <p className="text-sm">No extra fields found.</p>}
          {extras.map((e, idx) => (
            <div key={e.key} className="border p-3 rounded">
              <div className="font-semibold">{e.key}</div>
              <div className="text-xs text-gray-500 mb-2">
                {e.rows.slice(0, 3).map((r) => String(r.value)).join(", ")}
              </div>
              <select
                className="border rounded p-1 mr-2"
                value={e.type}
                onChange={(ev) => {
                  const val = ev.target.value as CustomField["type"];
                  setExtras((prev) => {
                    const copy = [...prev];
                    copy[idx].type = val;
                    return copy;
                  });
                }}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {(e.type === "select" || e.type === "multiselect") && (
                <input
                  className="border rounded p-1 mr-2"
                  placeholder="Options comma separated"
                  value={e.options.join(",")}
                  onChange={(ev) => {
                    const vals = ev.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setExtras((prev) => {
                      const copy = [...prev];
                      copy[idx].options = vals;
                      return copy;
                    });
                  }}
                />
              )}
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={() => promote(e)}
              >
                Promote
              </button>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
