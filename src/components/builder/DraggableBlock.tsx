import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiX } from "react-icons/fi";

interface Props {
  id: string;
  block: any;
  selected: boolean;
  onSelect(): void;
  onDelete(id: string): void;
}

export default function DraggableBlock({
  id,
  block,
  selected,
  onSelect,
  onDelete,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`border rounded p-2 mb-2 bg-white select-none touch-none cursor-grab active:cursor-grabbing ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <button
        type="button"
        aria-label="Delete block"
        className="absolute top-1 right-1 p-1 rounded text-gray-500 hover:text-red-600"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
      >
        <FiX />
      </button>
      {renderBlock(block)}
    </div>
  );
}

function renderBlock(block: any) {
  switch (block.type) {
    case "text":
      return <div>{block.text || "Text"}</div>;
    case "image":
      return (
        <img
          src={block.url || ""}
          alt={block.alt || ""}
          className="w-full"
          style={{ objectPosition: block.position || "center" }}
        />
      );
    case "input":
      return (
        <div>
          {block.label && (
            <label className="block text-sm mb-1">
              {block.label}
              {block.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input
            className="w-full border rounded p-1"
            placeholder={block.placeholder || ""}
            type={block.inputType === "phone" ? "tel" : block.inputType || "text"}
            readOnly
          />
        </div>
      );
    case "choice":
      return (
        <div>
          {block.label && (
            <label className="block text-sm mb-1">
              {block.label}
              {block.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <select className="w-full border rounded p-1" disabled>
            {(block.options || []).map((o: string, i: number) => (
              <option key={i}>{o}</option>
            ))}
          </select>
        </div>
      );
    case "checkbox":
      return (
        <div>
          {block.label && <span className="block text-sm mb-1">{block.label}</span>}
          <div className="space-y-1">
            {(block.options || []).map((o: string, i: number) => (
              <label key={i} className="flex items-center space-x-2 text-sm">
                <input type="checkbox" disabled />
                <span>{o}</span>
              </label>
            ))}
          </div>
        </div>
      );
    case "multiselect":
      return (
        <div>
          {block.label && <label className="block text-sm mb-1">{block.label}</label>}
          <select className="w-full border rounded p-1" multiple>
            {(block.options || []).map((o: string, i: number) => (
              <option key={i}>{o}</option>
            ))}
          </select>
        </div>
      );
    case "pdf":
      return (
        <div className="text-sm text-gray-600">
          PDF: {block.url || ""}
          {block.required && <span className="text-red-500 ml-1">*</span>}
        </div>
      );
    case "link":
      return (
        <a href={block.url || "#"} className="text-blue-600 underline">
          {block.text || "Link"}
          {block.required && <span className="text-red-500 ml-1">*</span>}
        </a>
      );
    case "button":
      return (
        <button className="bg-blue-600 text-white px-3 py-1 rounded" type="button">
          {block.text || "Button"}
        </button>
      );
    case "section":
      return <hr />;
    default:
      return <div>{block.type}</div>;
  }
}
