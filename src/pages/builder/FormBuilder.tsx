import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import BlockPalette from "@/components/builder/BlockPalette";
import DraggableBlock from "@/components/builder/DraggableBlock";
import PropertyPanel from "@/components/builder/PropertyPanel";
import FormSettingsPanel from "@/components/builder/FormSettingsPanel";
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
  const [style, setStyle] = useState<Record<string, any>>({});
  const [showPalette, setShowPalette] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  useEffect(() => {
    if (formId && formId !== "new") {
      fetchForm(formId)
        .then((f) => {
          setBlocks(f?.schema_json?.blocks || []);
          setStyle(f?.schema_json?.style || { backgroundColor: "#f9fafb" });
        })
        .catch(console.error);
    }
  }, [formId]);

  const addBlock = (type: string) => {
    const id = `${type}-${Date.now()}`;
    let block: Block = { id, type };
    switch (type) {
      case "text":
        block.text = "Text";
        break;
      case "image":
        block.url = "";
        block.alt = "";
        block.position = "center";
        break;
      case "input":
        block.label = "Label";
        block.name = `field_${Date.now()}`;
        block.placeholder = "";
        block.inputType = "text";
        block.required = false;
        break;
      case "choice":
        block.label = "Label";
        block.name = `choice_${Date.now()}`;
        block.options = ["Option 1", "Option 2"];
        block.required = false;
        break;
      case "checkbox":
        block.label = "Label";
        block.name = `checkbox_${Date.now()}`;
        block.options = ["Option 1", "Option 2"];
        block.required = false;
        break;
      case "multiselect":
        block.label = "Label";
        block.name = `multiselect_${Date.now()}`;
        block.options = ["Option 1", "Option 2"];
        block.required = false;
        break;
      case "pdf":
        block.url = "";
        block.required = false;
        break;
      case "link":
        block.text = "Link";
        block.url = "https://";
        block.required = false;
        break;
      case "button":
        block.text = "Submit";
        break;
      case "section":
        // no additional fields
        break;
      default:
        break;
    }
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

  const updateStyle = (updates: Record<string, any>) => {
    setStyle({ ...style, ...updates });
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selected === id) setSelected(null);
  };

  const handleSave = async () => {
    const payload: any = { schema_json: { blocks, style } };
    if (formId && formId !== "new") payload.id = formId;
    await saveForm(payload);
    navigate("/builder");
  };

  const selectedBlock = blocks.find((b) => b.id === selected) || null;

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Desktop block palette */}
      <div className="hidden md:block md:w-1/5 border-r overflow-y-auto">
        <BlockPalette onAdd={addBlock} />
      </div>

      {/* Mobile palette drawer */}
      {showPalette && (
        <div
          className="fixed inset-0 z-50 bg-white p-4 overflow-y-auto md:hidden"
          data-testid="mobile-palette"
        >
          <button
            onClick={() => setShowPalette(false)}
            className="mb-4 text-sm text-gray-600"
          >
            Close
          </button>
          <BlockPalette
            onAdd={(type) => {
              addBlock(type);
              setShowPalette(false);
            }}
          />
        </div>
      )}

      {/* Preview / layout area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {/* Mobile toggle buttons */}
        <div className="mb-2 flex gap-2 md:hidden">
          <button
            onClick={() => setShowPalette(true)}
            className="bg-blue-600 text-white px-2 py-1 rounded"
          >
            Blocks
          </button>
          {selectedBlock && (
            <button
              onClick={() => setShowInspector(true)}
              className="bg-gray-600 text-white px-2 py-1 rounded"
            >
              Props
            </button>
          )}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((b) => (
              <DraggableBlock
                key={b.id}
                id={b.id}
                block={b}
                selected={selected === b.id}
                onSelect={() => setSelected(b.id)}
                onDelete={deleteBlock}
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

      {/* Desktop inspector */}
      <div className="hidden md:block md:w-1/5 border-l overflow-y-auto">
        <FormSettingsPanel style={style} onChange={updateStyle} />
        <PropertyPanel block={selectedBlock} onChange={updateBlock} />
      </div>

      {/* Mobile inspector drawer */}
      {showInspector && (
        <div
          className="fixed inset-0 z-50 bg-white p-4 overflow-y-auto md:hidden"
          data-testid="mobile-inspector"
        >
          <button
            onClick={() => setShowInspector(false)}
            className="mb-4 text-sm text-gray-600"
          >
            Close
          </button>
          <FormSettingsPanel style={style} onChange={updateStyle} />
          <PropertyPanel block={selectedBlock} onChange={updateBlock} />
        </div>
      )}
    </div>
  );
}
