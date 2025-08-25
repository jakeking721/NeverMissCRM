import React, { useState } from "react";
import type { Customer } from "@/services/customerService";
import type { CustomField } from "@/services/fieldsService";
import { formatPhone, normalizePhone } from "@/utils/phone";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  customFields: CustomField[];
  onSave: (patch: Partial<Customer>) => Promise<void> | void;
}

export default function CustomerEditModal({
  isOpen,
  onClose,
  customers,
  customFields,
  onSave,
}: Props) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [apply, setApply] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const fields = [{ key: "zipCode", label: "Zip Code", type: "text" as const }, ...customFields];

  const handleChange = (key: string, value: any) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const handleToggle = (key: string, checked: boolean) => {
    setApply((a) => ({ ...a, [key]: checked }));
  };

  const handleSubmit = async () => {
    const patch: Record<string, any> = {};
    Object.keys(apply).forEach((k) => {
      if (apply[k]) patch[k] = values[k];
    });
    setSaving(true);
    try {
      await onSave(patch);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (f: { key: string; label: string; type: string; options?: string[] }) => {
    const disabled = !apply[f.key];
    const common = {
      className: "border rounded px-2 py-1 w-full text-sm",
      disabled,
    } as const;
    switch (f.type) {
      case "boolean":
        return (
          <select
            {...common}
            value={values[f.key] === undefined ? "" : values[f.key] ? "true" : "false"}
            onChange={(e) => handleChange(f.key, e.target.value === "true")}
          >
            <option value="" disabled>
              Select...
            </option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      case "select":
        return (
          <select
            {...common}
            value={values[f.key] ?? ""}
            onChange={(e) => handleChange(f.key, e.target.value)}
          >
            <option value=""></option>
            {f.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case "multiselect":
        return (
          <select
            {...common}
            multiple
            value={(values[f.key] as string[]) ?? []}
            onChange={(e) =>
              handleChange(
                f.key,
                Array.from(e.currentTarget.selectedOptions).map((o) => o.value),
              )
            }
          >
            {f.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      default: {
        let type = "text";
        if (f.type === "number") type = "number";
        else if (f.type === "date") type = "date";
        else if (f.type === "email") type = "email";
        else if (f.type === "phone") type = "tel";
        return (
          <input
            {...common}
            type={type}
            value={type === "tel" ? formatPhone(values[f.key] ?? "") : values[f.key] ?? ""}
            onChange={(e) =>
              handleChange(
                f.key,
                type === "tel" ? normalizePhone(e.target.value) : e.target.value,
              )
            }
          />
        );
      }
    }
  };

  const canSave = Object.values(apply).some(Boolean) && !saving;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Edit {customers.length} selected customer{customers.length !== 1 ? "s" : ""}
          </h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:underline">
            Cancel
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="flex items-center gap-2 text-sm mb-1">
                <input
                  type="checkbox"
                  checked={apply[f.key] ?? false}
                  onChange={(e) => handleToggle(f.key, e.target.checked)}
                />
                {f.label}
              </label>
              {renderInput({ ...(f as any), options: (f as any).options ?? undefined })}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50"
            disabled={saving}
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className={`px-4 py-2 text-sm rounded-md text-white ${
              canSave ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
