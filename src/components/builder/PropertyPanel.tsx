import React from "react";

interface Props {
  block: any | null;
  onChange(updates: Record<string, any>): void;
}

export default function PropertyPanel({ block, onChange }: Props) {
  if (!block) {
    return <div className="p-4 text-sm text-gray-500">Select a block</div>;
  }
  switch (block.type) {
    case "text":
      return (
        <div className="p-4 space-y-2">
          <label className="block text-sm font-medium">Text</label>
          <textarea
            className="w-full border rounded p-1"
            rows={3}
            value={block.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>
      );
    case "image":
      return (
        <div className="p-4 space-y-2">
          <label className="block text-sm font-medium">Image URL</label>
          <input
            className="w-full border rounded p-1"
            value={block.url || ""}
            onChange={(e) => onChange({ url: e.target.value })}
          />
          <label className="block text-sm font-medium">Alt text</label>
          <input
            className="w-full border rounded p-1"
            value={block.alt || ""}
            onChange={(e) => onChange({ alt: e.target.value })}
          />
          <label className="block text-sm font-medium">Position</label>
          <select
            className="w-full border rounded p-1"
            value={block.position || "center"}
            onChange={(e) => onChange({ position: e.target.value })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      );
    case "input":
      return (
        <div className="p-4 space-y-2">
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
          <label className="block text-sm font-medium">Type</label>
          <select
            className="w-full border rounded p-1"
            value={block.inputType || "text"}
            onChange={(e) => onChange({ inputType: e.target.value })}
          >
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
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
    case "choice":
      return (
        <div className="p-4 space-y-2">
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
    case "pdf":
      return (
        <div className="p-4 space-y-2">
          <label className="block text-sm font-medium">PDF URL</label>
          <input
            className="w-full border rounded p-1"
            value={block.url || ""}
            onChange={(e) => onChange({ url: e.target.value })}
          />
        </div>
      );
    case "link":
      return (
        <div className="p-4 space-y-2">
          <label className="block text-sm font-medium">Text</label>
          <input
            className="w-full border rounded p-1"
            value={block.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
          <label className="block text-sm font-medium">URL</label>
          <input
            className="w-full border rounded p-1"
            value={block.url || ""}
            onChange={(e) => onChange({ url: e.target.value })}
          />
        </div>
      );
    case "button":
      return (
        <div className="p-4 space-y-2">
          <label className="block text-sm font-medium">Text</label>
          <input
            className="w-full border rounded p-1"
            value={block.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>
      );
    default:
      return (
        <div className="p-4 text-sm text-gray-500">No editable properties</div>
      );
  }
}

