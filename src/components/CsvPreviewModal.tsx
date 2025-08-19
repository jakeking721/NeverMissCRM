import React, { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import type { CsvPreview } from "@/types/importPreview";

interface Props {
  preview: CsvPreview;
  onCancel: () => void;
  onConfirm: (
    userId: string,
    opts: { addFlags: Record<string, boolean>; headerToKey: Record<string, string | null> },
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
  const [addFlags, setAddFlags] = useState<Record<string, boolean>>(preview.addFlags);
  const [headerMap, setHeaderMap] = useState<Record<string, string | null>>(preview.headerToKey);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        alert("You must be logged in.");
        return;
      }
      await onConfirm(data.user.id, { addFlags, headerToKey: headerMap });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4 overflow-y-auto max-h-screen">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h3 className="text-lg font-semibold">CSV Import Preview</h3>

        {preview.unmatchedHeaders.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded space-y-1">
            <p>Unknown columns detected. Check any you wish to add as custom fields.</p>
            {preview.unmatchedHeaders.map((h) => (
              <label key={h} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addFlags[h]}
                  onChange={(e) => setAddFlags({ ...addFlags, [h]: e.target.checked })}
                />
                {h}
              </label>
            ))}
          </div>
        )}

        <div className="space-y-2 text-sm">
          {preview.headers.map((h) => (
            <div key={h} className="flex items-center gap-2">
              <span className="w-1/3 truncate">{h}</span>
              <select
                value={headerMap[h] ?? ""}
                onChange={(e) =>
                  setHeaderMap({ ...headerMap, [h]: e.target.value || null })
                }
                className="border rounded px-2 py-1 flex-1"
              >
                <option value="">Do not import</option>
                {preview.fieldOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
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
