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
    case "title":
      return <h2 className="text-lg font-semibold">{block.text || "Title"}</h2>;
    case "description":
      return <p className="text-sm text-gray-600">{block.text || "Description"}</p>;
    case "input":
      return (
        <div>
          {block.label && (
            <label className="block text-sm mb-1">
              {block.label}
              {block.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {block.fieldType === "textarea" ? (
            <textarea
              className="w-full border rounded p-1"
              placeholder={block.placeholder || ""}
              rows={3}
              readOnly
            />
          ) : (
            <input
              className="w-full border rounded p-1"
              placeholder={block.placeholder || ""}
              type={block.fieldType === "phone" ? "tel" : block.fieldType || "text"}
              readOnly
            />
          )}
        </div>
      );
    case "dropdown":
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
        <label className="flex items-center space-x-2 text-sm">
          <input type="checkbox" disabled />
          <span>
            {block.label}
            {block.required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
      );
    case "image":
      return block.url ? (
        <img src={block.url} alt={block.alt || ""} className="w-full" />
      ) : (
        <div className="text-sm text-gray-400">No image selected</div>
      );
    case "link":
      return (
        <a href={block.url || "#"} className="text-blue-600 underline">
          {block.text || "Link"}
          {block.required && <span className="text-red-500 ml-1">*</span>}
        </a>
      );
    case "pdf":
      return (
        <div className="space-y-2">
          {block.displayStyle === "link" && (
            <a href={block.url || "#"} className="text-blue-600 underline">
              View PDF
            </a>
          )}
          {block.displayStyle !== "link" && block.url && (
            <iframe
              src={block.url}
              className={
                block.displayStyle === "embed"
                  ? "w-full h-96 border"
                  : "w-full h-48 border"
              }
            />
          )}
          {block.requireAccept && (
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" disabled />
              <span>I have read and accept</span>
            </label>
          )}
        </div>
      );
    default:
      return <div>{block.type}</div>;
  }
}
