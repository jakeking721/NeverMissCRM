import React from "react";

const BLOCKS = [
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
  { type: "input", label: "Input" },
  { type: "choice", label: "Choice" },
  { type: "checkbox", label: "Checkbox" },
  { type: "multiselect", label: "Multi-Select" },
  { type: "pdf", label: "PDF" },
  { type: "link", label: "Link" },
  { type: "button", label: "Button" },
  { type: "section", label: "Section Break" },
];

interface Props {
  onAdd(type: string): void;
}

export default function BlockPalette({ onAdd }: Props) {
  return (
    <div className="p-2 space-y-2">
      {BLOCKS.map((b) => (
        <button
          key={b.type}
          onClick={() => onAdd(b.type)}
          className="w-full border rounded p-2 text-left hover:bg-gray-50"
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
