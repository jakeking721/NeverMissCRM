import React from "react";
import { useDraggable } from "@dnd-kit/core";

interface PaletteBlock {
  type: string;
  label: string;
  factoryKey?: string; // when present, indicates a factory field
}

// Factory-provided fields map directly to known customer properties
const FACTORY_BLOCKS: PaletteBlock[] = [
  { type: "factory-first-name", label: "First Name", factoryKey: "first_name" },
  { type: "factory-last-name", label: "Last Name", factoryKey: "last_name" },
  { type: "factory-phone", label: "Phone", factoryKey: "phone" },
  { type: "factory-email", label: "Email", factoryKey: "email" },
  { type: "factory-zip", label: "Zip Code", factoryKey: "zip_code" },
  {
    type: "factory-consent",
    label: "Consent to Contact",
    factoryKey: "consent_to_contact",
  },
];

// Custom fields are user-defined and do not map to factory keys by default
const CUSTOM_BLOCKS: PaletteBlock[] = [
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
  block: PaletteBlock;
  onAdd(block: PaletteBlock): void;
}

function PaletteItem({ block, onAdd }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `palette-${block.type}`,
    data: { from: "palette", block },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => onAdd(block)}
      className="w-full border rounded p-2 text-left bg-white hover:bg-gray-50 flex items-center justify-between"
    >
      <span>{block.label}</span>
      {block.factoryKey && (
        <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Factory</span>
      )}
    </button>
  );
}

interface Props {
  onAdd(block: PaletteBlock): void;
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

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Factory Fields</h3>
          <div className="space-y-2">
            {FACTORY_BLOCKS.map((b) => (
              <PaletteItem key={b.type} block={b} onAdd={onAdd} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Custom Fields</h3>
          <div className="space-y-2">
            {CUSTOM_BLOCKS.map((b) => (
              <PaletteItem key={b.type} block={b} onAdd={onAdd} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { PaletteBlock };

