import React, { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import type { CsvPreview } from "@/types/importPreview";

interface Props {
  preview: CsvPreview;
  onCancel: () => void;
  onConfirm: (
    userId: string,
    columns: Record<string, { addNew: boolean; linkTo: string | null }>,
    dedupe: "email" | "phone",
  ) => Promise<void> | void;
  busy: boolean;
  setBusy: (v: boolean) => void;
  canConfirm?: boolean;
}

export default function CsvPreviewModal({
  preview,
  onCancel,
  onConfirm,
  busy,
  setBusy,
  canConfirm = true,
}: Props) {
  const [columns, setColumns] = useState(preview.columns);
  const [dedupeMode, setDedupeMode] = useState<"phone" | "email">("phone");

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        alert("You must be logged in.");
        return;
      }
      await onConfirm(data.user.id, columns, dedupeMode);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4 overflow-y-auto max-h-screen">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h3 className="text-lg font-semibold">Import Customers</h3>

        <p className="text-sm text-gray-700">
          Choose how to handle each column below. You can create a new field or
          link the column to an existing one. Columns left unlinked will be skipped.
        </p>

        <div className="space-y-2 text-sm">
          {preview.headers.map((h) => (
            <div
              key={h}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center"
            >
              <span className="truncate font-medium">{h}</span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={columns[h].addNew}
                  disabled={!!columns[h].linkTo}
                  onChange={(e) =>
                    setColumns({
                      ...columns,
                      [h]: { ...columns[h], addNew: e.target.checked },
                    })
                  }
                />
                <span>Create new field</span>
              </label>
              <select
                value={columns[h].linkTo ?? ""}
                onChange={(e) => {
                  const value = e.target.value || null;
                  setColumns({
                    ...columns,
                    [h]: {
                      addNew: value ? false : columns[h].addNew,
                      linkTo: value,
                    },
                  });
                }}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="">Link to existing field</option>
                {preview.fieldOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="dedupe" className="font-medium">
            Dedupe by
          </label>
          <select
            id="dedupe"
            value={dedupeMode}
            onChange={(e) => setDedupeMode(e.target.value as "phone" | "email")}
            className="border rounded px-2 py-1"
          >
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </select>
        </div>

        <div className="max-h-60 overflow-auto border rounded">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                {preview.headers.map((h) => (
                  <th key={h} className="px-2 py-1 border-b text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, 10).map((row, i) => (
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

        <p className="text-sm text-gray-600">
          Previewing first 10 of {preview.rows.length} rows.
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
            Cancel
          </button>
          {canConfirm && (
            <button
              onClick={handleConfirm}
              disabled={busy}
              className="px-3 py-2 text-sm bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {busy ? "Working..." : "Confirm Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
