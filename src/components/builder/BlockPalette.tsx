import React, { useEffect, useMemo, useState } from "react";
import { getFields, CustomField } from "@/services/fieldsService";

interface Props {
  block: any | null;
  onChange(updates: Record<string, any>): void;
  onSave?: () => void;
  onDelete?: () => void;
}

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/** Small inline editor for choice lists (dropdown / single-choice) */
function OptionsEditor({
  value,
  onChange,
  label = "Choices",
}: {
  value: string[] | undefined;
  onChange: (opts: string[]) => void;
  label?: string;
}) {
  const [opts, setOpts] = useState<string[]>(() =>
    (value && value.length ? value : ["Option 1"]).map(String)
  );
  const [bulkOpen, setBulkOpen] = useState(false);
  useEffect(() => {
    if (!value) return;
    setOpts(value.length ? value : ["Option 1"]);
  }, [value]);

  const update = (next: string[]) => {
    setOpts(next);
    onChange(next.filter((s) => s !== ""));
  };

  const addRow = (i?: number) => {
    const next = [...opts];
    const at = typeof i === "number" ? i + 1 : next.length;
    next.splice(at, 0, "");
    update(next);
  };
  const removeRow = (i: number) => {
    const next = opts.slice();
    next.splice(i, 1);
    update(next.length ? next : [""]);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= opts.length) return;
    const next = opts.slice();
    const [tmp] = next.splice(i, 1);
    next.splice(j, 0, tmp);
    update(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">{label}</label>
        <button
          type="button"
          onClick={() => setBulkOpen((v) => !v)}
          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          title="Paste many at once"
        >
          Bulk Add
        </button>
      </div>

      {opts.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="flex-1 border rounded p-1"
            value={opt}
            onChange={(e) => {
              const next = opts.slice();
              next[i] = e.target.value;
              update(next);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") addRow(i);
            }}
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => move(i, -1)}
              className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, +1)}
              className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
              title="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => addRow(i)}
              className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
              title="Add below"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-xs hover:bg-red-100"
              title="Remove"
            >
              ✖
            </button>
          </div>
        </div>
      ))}

      {bulkOpen && (
        <div className="space-y-2">
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={4}
            placeholder="Paste options here, one per line"
            onBlur={(e) => {
              const lines = e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              if (lines.length) update(lines);
            }}
          />
          <p className="text-xs text-gray-500">
            Tip: paste any list; empty lines are ignored.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PropertyPanel({ block, onChange, onDelete, onSave }: Props) {
  const [registry, setRegistry] = useState<CustomField[]>([]);
  useEffect(() => {
    getFields().then(setRegistry).catch(console.error);
  }, []);

  // Autofocus target for UX (label for most controls, text for content blocks)
  const firstInputId = useMemo(() => {
    if (!block) return "";
    if (block.type === "title" || block.type === "description") return "nm-pp-text";
    return "nm-pp-label";
  }, [block]);

  if (!block) {
    return <div className="p-4 text-sm text-gray-500">Select a block</div>;
  }

  let specific: React.ReactNode = null;

  switch (block.type) {
    case "title":
      specific = (
        <div className="space-y-2">
          <label htmlFor="nm-pp-text" className="block text-sm font-medium">
            Header Text
          </label>
          <input
            id="nm-pp-text"
            className="w-full border rounded p-1"
            value={block.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
            autoFocus
          />
        </div>
      );
      break;

    case "description":
      specific = (
        <div className="space-y-2">
          <label htmlFor="nm-pp-text" className="block text-sm font-medium">
            Body Text
          </label>
          <textarea
            id="nm-pp-text"
            className="w-full border rounded p-2"
            rows={3}
            value={block.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
            autoFocus
          />
        </div>
      );
      break;

    case "input": {
      // covers text, email, phone, textarea, comment section
      const isTextarea = block.control_type === "textarea";
      specific = (
        <div className="space-y-2">
          <label htmlFor="nm-pp-label" className="block text-sm font-medium">
            {isTextarea ? "Comment Section Label" : "Label"}
          </label>
          <input
            id="nm-pp-label"
            className="w-full border rounded p-1"
            value={block.label || ""}
            onChange={(e) => onChange({ label: e.target.value })}
            autoFocus
          />
          <label className="block text-sm font-medium">Field Name</label>
          <input
            {...(import.meta.env.VITEST ? {} : { list: "field-names" })}
            className="w-full border rounded p-1 font-mono"
            value={block.fieldName || ""}
            onChange={(e) => {
              const value = e.target.value.trim();
              const match = registry.find((f) => f.key === value);
              const updates: any = {
                fieldName: value,
                dataKey: value ? `r.${value}` : `c.${block.block_id}`,
              };
              if (match && (!block.label || block.label === "")) {
                updates.label = match.label;
              }
              onChange(updates);
            }}
          />
          {!isTextarea && (
            <>
              <label className="block text-sm font-medium">Placeholder</label>
              <input
                className="w-full border rounded p-1"
                value={block.placeholder || ""}
                onChange={(e) => onChange({ placeholder: e.target.value })}
              />
            </>
          )}
          <label className="inline-flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={!!block.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
            <span>Required</span>
          </label>
        </div>
      );
      break;
    }

    case "dropdown":
      specific = (
        <div className="space-y-3">
          <div>
            <label htmlFor="nm-pp-label" className="block text-sm font-medium">
              Label
            </label>
            <input
              id="nm-pp-label"
              className="w-full border rounded p-1"
              value={block.label || ""}
              onChange={(e) => onChange({ label: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Field Name</label>
            <input
              {...(import.meta.env.VITEST ? {} : { list: "field-names" })}
              className="w-full border rounded p-1 font-mono"
              value={block.fieldName || ""}
              onChange={(e) => {
                const value = e.target.value.trim();
                const match = registry.find((f) => f.key === value);
                const updates: any = {
                  fieldName: value,
                  dataKey: value ? `r.${value}` : `c.${block.block_id}`,
                };
                if (match && (!block.label || block.label === "")) {
                  updates.label = match.label;
                }
                onChange(updates);
              }}
            />
          </div>

          <OptionsEditor
            value={block.options}
            onChange={(opts) => onChange({ options: opts })}
            label="Options"
          />

          <label className="inline-flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={!!block.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
            <span>Required</span>
          </label>
        </div>
      );
      break;

    case "single-choice": // radio, select one
      specific = (
        <div className="space-y-3">
          <div>
            <label htmlFor="nm-pp-label" className="block text-sm font-medium">
              Label
            </label>
            <input
              id="nm-pp-label"
              className="w-full border rounded p-1"
              value={block.label || ""}
              onChange={(e) => onChange({ label: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Field Name</label>
            <input
              {...(import.meta.env.VITEST ? {} : { list: "field-names" })}
              className="w-full border rounded p-1 font-mono"
              value={block.fieldName || ""}
              onChange={(e) => {
                const value = e.target.value.trim();
                const match = registry.find((f) => f.key === value);
                const updates: any = {
                  fieldName: value,
                  dataKey: value ? `r.${value}` : `c.${block.block_id}`,
                };
                if (match && (!block.label || block.label === "")) {
                  updates.label = match.label;
                }
                onChange(updates);
              }}
            />
          </div>

          <OptionsEditor
            value={block.options}
            onChange={(opts) => onChange({ options: opts })}
            label="Choices (select one)"
          />

          <label className="inline-flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={!!block.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
            <span>Required</span>
          </label>
        </div>
      );
      break;

    case "checkbox":
      // simple boolean (not multi-select)
      specific = (
        <div className="space-y-2">
          <label htmlFor="nm-pp-label" className="block text-sm font-medium">
            Label
          </label>
          <input
            id="nm-pp-label"
            className="w-full border rounded p-1"
            value={block.label || ""}
            onChange={(e) => onChange({ label: e.target.value })}
            autoFocus
          />
          <label className="block text-sm font-medium">Field Name</label>
          <input
            {...(import.meta.env.VITEST ? {} : { list: "field-names" })}
            className="w-full border rounded p-1 font-mono"
            value={block.fieldName || ""}
            onChange={(e) => {
              const value = e.target.value.trim();
              const match = registry.find((f) => f.key === value);
              const updates: any = {
                fieldName: value,
                dataKey: value ? `r.${value}` : `c.${block.block_id}`,
              };
              if (match && (!block.label || block.label === "")) {
                updates.label = match.label;
              }
              onChange(updates);
            }}
          />
          <label className="inline-flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={!!block.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
            <span>Required</span>
          </label>
        </div>
      );
      break;

    case "image":
      specific = (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                onChange({ url });
              }
            }}
          />
          {block.url && (
            <img src={block.url} alt="preview" className="mt-2 max-h-40" />
          )}
          <label className="block text-sm font-medium">Alt text</label>
          <input
            className="w-full border rounded p-1"
            value={block.alt || ""}
            onChange={(e) => onChange({ alt: e.target.value })}
          />
        </div>
      );
      break;

    case "link": {
      const valid = !block.url || isValidUrl(block.url);
      specific = (
        <div className="space-y-2">
          <label htmlFor="nm-pp-label" className="block text-sm font-medium">
            Text
          </label>
          <input
            id="nm-pp-label"
            className="w-full border rounded p-1"
            value={block.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
            autoFocus
          />
          <label className="block text-sm font-medium">URL</label>
          <input
            className={`w-full border rounded p-1 ${
              valid ? "" : "border-red-500"
            }`}
            value={block.url || ""}
            onChange={(e) => onChange({ url: e.target.value })}
          />
          {!valid && <p className="text-xs text-red-500">Invalid URL</p>}
          <label className="inline-flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={!!block.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
            <span>Required</span>
          </label>
        </div>
      );
      break;
    }

    case "pdf":
      specific = (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Upload PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                onChange({ url });
              }
            }}
          />
          <label className="block text-sm font-medium">Display Style</label>
          <select
            className="w-full border rounded p-1"
            value={block.displayStyle || "scroll"}
            onChange={(e) => onChange({ displayStyle: e.target.value })}
          >
            <option value="scroll">Scrollable Box</option>
            <option value="link">Download Link</option>
            <option value="embed">Full Embedded View</option>
          </select>
          <label className="inline-flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={!!block.requireAccept}
              onChange={(e) => onChange({ requireAccept: e.target.checked })}
            />
            <span>Require checkbox to accept</span>
          </label>
          <label className="inline-flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={!!block.promptDownload}
              onChange={(e) => onChange({ promptDownload: e.target.checked })}
            />
            <span>Prompt for optional download</span>
          </label>
        </div>
      );
      break;

    default:
      specific = (
        <div className="text-sm text-gray-500">No editable properties</div>
      );
  }

  const showFactoryMap =
    block.type !== "title" &&
    block.type !== "description" &&
    block.type !== "image" &&
    block.type !== "pdf";

  const factoryOptions = (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium">Field Type</label>
        <input
          className="w-full border rounded p-1 bg-gray-100"
          value={block.control_type}
          readOnly
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Maps to Factory Field</label>
        <select
          className="w-full border rounded p-1"
          value={block.mapsToFactory || ""}
          onChange={(e) => {
            const value = e.target.value || null;
            onChange({
              mapsToFactory: value,
              dataKey: value ? `f.${value}` : `c.${block.block_id}`,
            });
          }}
        >
          <option value="">None</option>
          <option value="first_name">First Name</option>
          <option value="last_name">Last Name</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
          <option value="zip_code">Zip Code</option>
          <option value="consent_to_contact">Consent to Contact</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Factory mapping prevents collisions (e.g., custom “ZIP” won’t overwrite Zip Code).
        </p>
      </div>
      <label className="inline-flex items-center space-x-2 text-sm">
        <input
          type="checkbox"
          checked={block.saveToLatest !== false}
          onChange={(e) => onChange({ saveToLatest: e.target.checked })}
        />
        <span>Save to Latest Values</span>
      </label>
      {block.control_type === "phone" && (
        <div>
          <label className="block text-sm font-medium">Validation</label>
          <select
            className="w-full border rounded p-1"
            value={block.validationSubtype || "default"}
            onChange={(e) => onChange({ validationSubtype: e.target.value })}
          >
            <option value="default">Default</option>
            <option value="us">US Phone</option>
            <option value="intl">International</option>
          </select>
        </div>
      )}
      {block.control_type === "email" && (
        <div>
          <label className="block text-sm font-medium">Validation</label>
          <select
            className="w-full border rounded p-1"
            value={block.validationSubtype || "default"}
            onChange={(e) => onChange({ validationSubtype: e.target.value })}
          >
            <option value="default">Default</option>
            <option value="strict">Strict</option>
            <option value="loose">Loose</option>
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      {specific}
      {showFactoryMap && factoryOptions}

      {!import.meta.env.VITEST && (
        <datalist id="field-names">
          {registry.map((f) => (
            <option key={f.key} value={f.key} />
          ))}
        </datalist>
      )}

      {/* Footer actions */}
      <div className="pt-2 mt-2 border-t flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSave}
          className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-3 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
