import React, { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";

export interface PaletteBlock {
  type: string;
  label: string;
  /** When present, indicates a factory field and the customer column it maps to */
  factoryKey?: string;
}

interface PaletteItemProps {
  block: PaletteBlock;
  onAdd(block: PaletteBlock): void;
}

/** One palette button that supports both click-to-add and drag-from-palette */
function PaletteItem({ block, onAdd }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
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
      className={[
        "w-full border rounded-lg px-3 py-2 text-left bg-white hover:bg-gray-50",
        "flex items-center justify-between gap-2 transition",
        isDragging ? "opacity-70" : "",
      ].join(" ")}
      aria-label={block.label}
    >
      <span className="truncate">{block.label}</span>
      {block.factoryKey && (
        <span className="text-[10px] leading-none bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          Factory
        </span>
      )}
    </button>
  );
}

// ---------- Palette Data ----------

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
  { type: "title", label: "Header" },                 // renamed from Form Title
  { type: "description", label: "Body Text" },        // renamed from Form Description
  { type: "text", label: "Text Input" },
  { type: "dropdown", label: "Dropdown Selection" },
  { type: "single-choice", label: "Single Choice" },  // NEW: radio (select one)
  { type: "textarea", label: "Comment Section" },     // renamed from Textarea
  { type: "checkbox", label: "Checkbox" },
  { type: "image", label: "Image Upload" },
  { type: "link", label: "Website Link" },
  { type: "pdf", label: "PDF Waiver" },
];

interface Props {
  onAdd(block: PaletteBlock): void;
  background: string;
  onBackgroundChange(value: string): void;
}

export default function BlockPalette({
  onAdd,
  background,
  onBackgroundChange,
}: Props) {
  const [showFactory, setShowFactory] = useState(true);
  const [showCustom, setShowCustom] = useState(true);
  const [query, setQuery] = useState("");

  const filteredCustom = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CUSTOM_BLOCKS;
    return CUSTOM_BLOCKS.filter((b) => b.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="p-4 space-y-4">
      {/* Background color */}
      <div>
        <label className="block text-sm font-medium mb-1">Background Color</label>
        <input
          type="color"
          aria-label="Background Color"
          className="w-full h-10 border rounded cursor-pointer"
          value={background}
          onChange={(e) => onBackgroundChange(e.target.value)}
        />
      </div>

      {/* Factory Fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Factory Fields</h3>
          <button
            type="button"
            onClick={() => setShowFactory((v) => !v)}
            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
            aria-expanded={showFactory}
          >
            {showFactory ? "Hide" : "Show"}
          </button>
        </div>
        {showFactory && (
          <div className="space-y-2">
            {FACTORY_BLOCKS.map((b) => (
              <PaletteItem key={b.type} block={b} onAdd={onAdd} />
            ))}
          </div>
        )}
      </div>

      {/* Custom Fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Custom Fields</h3>
          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
            aria-expanded={showCustom}
          >
            {showCustom ? "Hide" : "Show"}
          </button>
        </div>

        {/* Quick search (local filter) */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search fields…"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {showCustom && (
          <div className="space-y-2 mt-2">
            {filteredCustom.map((b) => (
              <PaletteItem key={b.type} block={b} onAdd={onAdd} />
            ))}
            {filteredCustom.length === 0 && (
              <p className="text-xs text-gray-500 px-1">No matches.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
