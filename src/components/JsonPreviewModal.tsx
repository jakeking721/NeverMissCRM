import React, { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import type { JsonPreview } from "@/types/importPreview";

interface Props {
  preview: JsonPreview;
  onCancel: () => void;
  onConfirm: (
    userId: string,
    opts: { addFlags: Record<string, boolean>; keyToField: Record<string, string | null> },
  ) => Promise<void> | void;
  busy: boolean;
  setBusy: (v: boolean) => void;
  canConfirm?: boolean;
}

export default function JsonPreviewModal({
  preview,
  onCancel,
  onConfirm,
  busy,
  setBusy,
  canConfirm = true,
}: Props) {
  const [addFlags, setAddFlags] = useState<Record<string, boolean>>(preview.addFlags);
  const [keyMap, setKeyMap] = useState<Record<string, string | null>>(preview.keyToField);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        alert("You must be logged in.");
        return;
      }
      await onConfirm(data.user.id, { addFlags, keyToField: keyMap });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 space-y-4">
        <h3 className="text-lg font-semibold">JSON Import Preview</h3>

        {preview.unknownKeys.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded space-y-2">
            <p>
              Unknown fields detected. Check any you wish to add as custom fields or map to existing
              ones.
            </p>
            {preview.unknownKeys.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <label className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={addFlags[k]}
                    onChange={(e) => setAddFlags({ ...addFlags, [k]: e.target.checked })}
                  />
                  {k}
                </label>
                <select
                  value={keyMap[k] ?? ""}
                  onChange={(e) =>
                    setKeyMap({ ...keyMap, [k]: e.target.value || null })
                  }
                  className="border rounded px-2 py-1"
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
        )}

        <div className="max-h-60 overflow-auto border rounded text-xs">
          <pre className="p-2 whitespace-pre-wrap">
            {JSON.stringify(preview.customers.slice(0, 5), null, 2)}
          </pre>
        </div>

        <p className="text-sm text-gray-600">
          Previewing first {Math.min(5, preview.customers.length)} of {preview.customers.length} entries.
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
