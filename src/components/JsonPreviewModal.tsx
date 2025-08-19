import React from "react";
import { supabase } from "@/utils/supabaseClient";
import type { JsonPreview } from "@/types/importPreview";

interface Props {
  preview: JsonPreview;
  onCancel: () => void;
  onConfirm: (userId: string) => Promise<void> | void;
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
  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        alert("You must be logged in.");
        return;
      }
      await onConfirm(data.user.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 space-y-4">
        <h3 className="text-lg font-semibold">JSON Import Preview</h3>

        {preview.unknownKeys.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded space-y-1">
            <p>Unknown fields detected. Check any you wish to add as custom fields.</p>
            {preview.unknownKeys.map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preview.addFlags[k]}
                  onChange={(e) => (preview.addFlags[k] = e.target.checked)}
                />
                {k}
              </label>
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
