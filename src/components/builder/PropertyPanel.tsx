import React from "react";

interface Props {
  block: any | null;
  onChange(updates: Record<string, any>): void;
}

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default function PropertyPanel({ block, onChange }: Props) {
  if (!block) {
    return <div className="p-4 text-sm text-gray-500">Select a block</div>;
  }

  let specific: React.ReactNode = null;

  switch (block.type) {
    case "title":
    case "description":
      specific = (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Text</label>
          <input
            className="w-full border rounded p-1"
            value={block.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>
      );
      break;
    case "input":
      specific = (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Label</label>
          <input
            className="w-full border rounded p-1"
            value={block.label || ""}
            onChange={(e) => onChange({ label: e.target.value })}
          />
          <label className="block text-sm font-medium">Field Name</label>
          <input
            className="w-full border rounded p-1"
            value={block.name || ""}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <label className="block text-sm font-medium">Placeholder</label>
          <input
            className="w-full border rounded p-1"
            value={block.placeholder || ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
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
    case "dropdown":
      specific = (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Label</label>
          <input
            className="w-full border rounded p-1"
            value={block.label || ""}
            onChange={(e) => onChange({ label: e.target.value })}
          />
          <label className="block text-sm font-medium">Field Name</label>
          <input
            className="w-full border rounded p-1"
            value={block.name || ""}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <label className="block text-sm font-medium">Options (one per line)</label>
          <textarea
            className="w-full border rounded p-1"
            rows={3}
            value={(block.options || []).join("\n")}
            onChange={(e) =>
              onChange({ options: e.target.value.split("\n").filter(Boolean) })
            }
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
      specific = (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Label</label>
          <input
            className="w-full border rounded p-1"
            value={block.label || ""}
            onChange={(e) => onChange({ label: e.target.value })}
          />
          <label className="block text-sm font-medium">Field Name</label>
          <input
            className="w-full border rounded p-1"
            value={block.name || ""}
            onChange={(e) => onChange({ name: e.target.value })}
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
          {block.url && <img src={block.url} alt="preview" className="mt-2 max-h-40" />}
          <label className="block text-sm font-medium">Alt text</label>
          <input
            className="w-full border rounded p-1"
            value={block.alt || ""}
            onChange={(e) => onChange({ alt: e.target.value })}
          />
        </div>
      );
      break;
    case "link":
      const valid = !block.url || isValidUrl(block.url);
      specific = (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Text</label>
          <input
            className="w-full border rounded p-1"
            value={block.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
          <label className="block text-sm font-medium">URL</label>
          <input
            className={`w-full border rounded p-1 ${valid ? "" : "border-red-500"}`}
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
      specific = <div className="text-sm text-gray-500">No editable properties</div>;
  }

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
      {factoryOptions}
    </div>
  );
}
