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
          <input
            className="w-full border rounded p-1"
            value={block.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>
      );
    default:
      return <div className="p-4 text-sm text-gray-500">No editable properties</div>;
  }
}
