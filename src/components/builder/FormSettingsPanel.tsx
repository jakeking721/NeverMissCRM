import React from "react";

interface Props {
  style: Record<string, any>;
  onChange(updates: Record<string, any>): void;
}

export default function FormSettingsPanel({ style, onChange }: Props) {
  const backgroundColor = style.backgroundColor || "#ffffff";

  const handleChange = (value: string) => {
    onChange({ backgroundColor: value });
  };

  return (
    <div className="p-4 space-y-2 border-b">
      <h2 className="text-sm font-semibold">Form Settings</h2>
      <label className="block text-sm font-medium">Background Color</label>
      <input
        type="color"
        aria-label="Background Color"
        className="w-full h-10 border rounded"
        value={backgroundColor}
        onChange={(e) => handleChange(e.target.value)}
      />
      <input
        type="text"
        aria-label="Background Color Hex"
        className="w-full border rounded p-1 text-sm"
        value={backgroundColor}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
}

