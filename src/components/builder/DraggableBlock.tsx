import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DraggableBlockProps {
  id: string;
  block: any;
  selected?: boolean;
  onSelect?: () => void;
  /** Kept for compatibility but not used (delete is done in Block Settings) */
  onDelete?: (id: string) => void;
}

export default function DraggableBlock({
  id,
  block,
  selected,
  onSelect,
}: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Select immediately on pointer down so a single click always opens Block Settings
  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = () => {
    onSelect?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onPointerDown={handlePointerDown}
      className={[
        "mb-3 rounded-lg border bg-white",
        selected ? "ring-2 ring-blue-400 border-blue-400" : "border-gray-200",
        isDragging ? "opacity-80" : "",
      ].join(" ")}
    >
      {/* Header row: label + badges + drag handle */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {block.label || prettyType(block)}
          </span>
          {block?.mapsToFactory && (
            <span className="text-[10px] leading-none bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Factory
            </span>
          )}
        </div>

        {/* Drag handle – attach sortable listeners to the handle, not the whole card */}
        <button
          type="button"
          className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded border text-gray-500 hover:bg-gray-50"
          title="Drag to reorder"
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
        >
          {/* grip icon */}
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M7 4h2v2H7V4zm4 0h2v2h-2V4zM7 9h2v2H7V9zm4 0h2v2h-2V9zM7 14h2v2H7v-2zm4 0h2v2h-2v-2z" />
          </svg>
        </button>
      </div>

      {/* Preview body */}
      <div className="px-3 pb-3">
        {renderPreview(block)}
      </div>
    </div>
  );
}

function prettyType(block: any): string {
  switch (block?.type) {
    case "title":
      return "Header";
    case "description":
      return "Body Text";
    case "input":
      if (block?.control_type === "textarea") return "Comment Section";
      if (block?.control_type === "email") return "Email";
      if (block?.control_type === "phone") return "Phone";
      return "Text Input";
    case "dropdown":
      return "Dropdown";
    case "single-choice":
      return "Single Choice";
    case "checkbox":
      return "Checkbox";
    case "image":
      return "Image";
    case "link":
      return "Website Link";
    case "pdf":
      return "PDF Waiver";
    default:
      return "Field";
  }
}

function renderPreview(block: any) {
  const common =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white";

  switch (block?.type) {
    case "title":
      return (
        <input
          className={common + " text-base font-semibold"}
          readOnly
          value={block?.text || "Header"}
        />
      );

    case "description":
      return (
        <textarea
          className={common}
          readOnly
          rows={3}
          value={block?.text || "Body text"}
        />
      );

    case "input": {
      if (block?.control_type === "textarea") {
        return (
          <textarea
            className={common}
            readOnly
            rows={3}
            placeholder={block?.placeholder || "Comment…"}
          />
        );
      }
      return (
        <input
          className={common}
          readOnly
          placeholder={block?.placeholder || block?.label || "Input"}
        />
      );
    }

    case "dropdown": {
      const options: string[] = Array.isArray(block?.options)
        ? block.options
        : ["Option 1"];
      return (
        <select className={common} disabled>
          {options.map((o: string, i: number) => (
            <option key={i}>{o}</option>
          ))}
        </select>
      );
    }

    case "single-choice": {
      const options: string[] = Array.isArray(block?.options)
        ? block.options
        : ["Choice 1"];
      return (
        <div className="space-y-1">
          {options.map((o: string, i: number) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <input type="radio" disabled />
              <span>{o}</span>
            </label>
          ))}
        </div>
      );
    }

    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled />
          <span>{block?.label || "Checkbox"}</span>
        </label>
      );

    case "image":
      return (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-xs text-gray-500">
          Image placeholder
        </div>
      );

    case "link":
      return (
        <div className="text-blue-600 underline text-sm">
          {block?.text || "Website Link"}
        </div>
      );

    case "pdf":
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-red-600">
            PDF
          </span>
          <span className="text-gray-600">Waiver preview</span>
        </div>
      );

    default:
      return <div className="text-sm text-gray-500">Field preview</div>;
  }
}
