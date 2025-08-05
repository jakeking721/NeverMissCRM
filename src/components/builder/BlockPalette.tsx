import React from "react";
import { useDraggable } from "@dnd-kit/core";

const BLOCKS = [
  { type: "title", label: "Form Title" },
  { type: "description", label: "Form Description" },
  { type: "text", label: "Text Input" },
  { type: "email", label: "Email" },
  { type: "phone", label: "Phone Number" },
  { type: "dropdown", label: "Dropdown Selection" },
  { type: "textarea", label: "Textarea" },
  { type: "checkbox", label: "Checkbox" },
  { type: "image", label: "Image Upload" },
  { type: "link", label: "Website Link" },
  { type: "pdf", label: "PDF Waiver" },
];

interface PaletteItemProps {
  type: string;
  label: string;
  onAdd(type: string): void;
}

function PaletteItem({ type, label, onAdd }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `palette-${type}`,
    data: { from: "palette", type },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => onAdd(type)}
      className="w-full border rounded p-2 text-left bg-white hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

interface Props {
  onAdd(type: string): void;
  background: string;
  onBackgroundChange(value: string): void;
}

export default function BlockPalette({ onAdd, background, onBackgroundChange }: Props) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium">Background Color</label>
        <input
          type="color"
          aria-label="Background Color"
          className="w-full h-10 border rounded"
          value={background}
          onChange={(e) => onBackgroundChange(e.target.value)}
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Add Fields</h3>
        <div className="space-y-2">
          {BLOCKS.map((b) => (
            <PaletteItem key={b.type} type={b.type} label={b.label} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </div>
  );
}
