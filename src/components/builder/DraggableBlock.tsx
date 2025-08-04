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
      {block.type === "text" ? block.text || "Text" : block.type}
    </div>
  );
}
