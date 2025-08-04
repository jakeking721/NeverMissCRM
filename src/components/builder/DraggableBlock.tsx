import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  id: string;
  block: any;
  selected: boolean;
  onSelect(): void;
}

export default function DraggableBlock({ id, block, selected, onSelect }: Props) {
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
      className={`border rounded p-2 mb-2 bg-white cursor-move ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
    >
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
          {block.label && <label className="block text-sm mb-1">{block.label}</label>}
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
          {block.label && <label className="block text-sm mb-1">{block.label}</label>}
          <select className="w-full border rounded p-1">
            {(block.options || []).map((o: string, i: number) => (
              <option key={i}>{o}</option>
            ))}
          </select>
        </div>
      );
    case "pdf":
      return <div className="text-sm text-gray-600">PDF: {block.url || ""}</div>;
    case "link":
      return (
        <a href={block.url || "#"} className="text-blue-600 underline">
          {block.text || "Link"}
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
