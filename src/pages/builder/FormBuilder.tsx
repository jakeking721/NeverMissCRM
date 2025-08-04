import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import BlockPalette from "@/components/builder/BlockPalette";
import DraggableBlock from "@/components/builder/DraggableBlock";
import PropertyPanel from "@/components/builder/PropertyPanel";
import { fetchForm, saveForm } from "@/services/forms";

interface Block {
  id: string;
  type: string;
  [key: string]: any;
}

export default function FormBuilder() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [style] = useState<Record<string, any>>({});

  useEffect(() => {
    if (formId && formId !== "new") {
      fetchForm(formId)
        .then((f) => setBlocks(f?.schema_json?.blocks || []))
        .catch(console.error);
    }
  }, [formId]);

  const addBlock = (type: string) => {
    const id = `${type}-${Date.now()}`;
    const block: Block = { id, type };
    if (type === "text") block.text = "Text";
    setBlocks([...blocks, block]);
    setSelected(id);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    setBlocks(arrayMove(blocks, oldIndex, newIndex));
  };

  const updateBlock = (updates: Record<string, any>) => {
    if (!selected) return;
    setBlocks(blocks.map((b) => (b.id === selected ? { ...b, ...updates } : b)));
  };

  const handleSave = async () => {
    const payload: any = { schema_json: { blocks, style } };
    if (formId && formId !== "new") payload.id = formId;
    await saveForm(payload);
    navigate("/builder");
  };

  const selectedBlock = blocks.find((b) => b.id === selected) || null;

  return (
    <div className="flex h-screen">
      {/* Block palette */}
      <div className="w-1/5 border-r overflow-y-auto">
        <BlockPalette onAdd={addBlock} />
      </div>
      {/* Preview / layout area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((b) => (
              <DraggableBlock
                key={b.id}
                id={b.id}
                block={b}
                selected={selected === b.id}
                onSelect={() => setSelected(b.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className="mt-4">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
      {/* Inspector */}
      <div className="w-1/5 border-l overflow-y-auto">
        <PropertyPanel block={selectedBlock} onChange={updateBlock} />
      </div>
    </div>
  );
}
