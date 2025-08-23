import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";

import PageShell from "@/components/PageShell";
import BlockPalette, { PaletteBlock } from "@/components/builder/BlockPalette";
import DraggableBlock from "@/components/builder/DraggableBlock";
import PropertyPanel from "@/components/builder/PropertyPanel";
import { fetchForm, saveForm } from "@/services/forms";
import { toast } from "react-toastify";

interface Block {
  id: string; // used for DnD
  block_id: string; // persisted identifier
  type: string;
  control_type: string;
  mapsToFactory: string | null;
  dataKey: string;
  saveToLatest: boolean;
  validationSubtype?: string;
  [key: string]: any;
}

export default function FormBuilder() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [style, setStyle] = useState<Record<string, any>>({ backgroundColor: "#ffffff" });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));
  const { setNodeRef: setCanvasRef } = useDroppable({ id: "canvas" });

  useEffect(() => {
    if (formId && formId !== "new") {
      fetchForm(formId)
        .then((f) => {
          setBlocks(f?.schema_json?.blocks || []);
          setStyle(f?.schema_json?.style || { backgroundColor: "#f9fafb" });
          setTitle(f?.title || "");
          setDescription(f?.description || "");
        })
        .catch(console.error);
    }
  }, [formId]);

  const createBlock = (paletteBlock: PaletteBlock): Block => {
    const block_id = uuidv4();
    const base: Partial<Block> = {
      id: block_id,
      block_id,
      mapsToFactory: paletteBlock.factoryKey ?? null,
      control_type: paletteBlock.type,
      saveToLatest: true,
    };
    const dataKey = paletteBlock.factoryKey
      ? `f.${paletteBlock.factoryKey}`
      : `c.${block_id}`;
    let block: Block = { ...(base as Block), dataKey, type: paletteBlock.type };

    switch (paletteBlock.type) {
      case "title":
        block = { ...block, type: "title", control_type: "title", text: "Form Title" };
        break;
      case "description":
        block = {
          ...block,
          type: "description",
          control_type: "description",
          text: "Form description",
        };
        break;
      case "text":
        block = {
          ...block,
          type: "input",
          control_type: "text",
          fieldType: "text",
          label: "Text",
          name: `field_${block_id}`,
          placeholder: "",
          required: false,
        };
        break;
      case "email":
        block = {
          ...block,
          type: "input",
          control_type: "email",
          fieldType: "email",
          label: "Email",
          name: `email_${block_id}`,
          placeholder: "",
          required: false,
        };
        break;
      case "phone":
        block = {
          ...block,
          type: "input",
          control_type: "phone",
          fieldType: "phone",
          label: "Phone",
          name: `phone_${block_id}`,
          placeholder: "",
          required: false,
        };
        break;
      case "dropdown":
        block = {
          ...block,
          type: "dropdown",
          control_type: "dropdown",
          label: "Dropdown",
          name: `dropdown_${block_id}`,
          options: ["Option 1"],
          required: false,
        };
        break;
      case "textarea":
        block = {
          ...block,
          type: "input",
          control_type: "textarea",
          fieldType: "textarea",
          label: "Textarea",
          name: `textarea_${block_id}`,
          placeholder: "",
          required: false,
        };
        break;
      case "checkbox":
        block = {
          ...block,
          type: "checkbox",
          control_type: "checkbox",
          label: "Checkbox",
          name: `checkbox_${block_id}`,
          required: false,
        };
        break;
      case "image":
        block = {
          ...block,
          type: "image",
          control_type: "image",
          url: "",
          alt: "",
        };
        break;
      case "link":
        block = {
          ...block,
          type: "link",
          control_type: "link",
          text: "Website",
          url: "https://",
          required: false,
        };
        break;
      case "pdf":
        block = {
          ...block,
          type: "pdf",
          control_type: "pdf",
          url: "",
          displayStyle: "scroll",
          requireAccept: false,
          promptDownload: false,
        };
        break;
      case "factory-first-name":
        block = {
          ...block,
          type: "input",
          control_type: "text",
          fieldType: "text",
          label: "First Name",
          name: `first_name_${block_id}`,
          required: false,
        };
        break;
      case "factory-last-name":
        block = {
          ...block,
          type: "input",
          control_type: "text",
          fieldType: "text",
          label: "Last Name",
          name: `last_name_${block_id}`,
          required: false,
        };
        break;
      case "factory-phone":
        block = {
          ...block,
          type: "input",
          control_type: "phone",
          fieldType: "phone",
          label: "Phone",
          name: `phone_${block_id}`,
          required: false,
        };
        break;
      case "factory-email":
        block = {
          ...block,
          type: "input",
          control_type: "email",
          fieldType: "email",
          label: "Email",
          name: `email_${block_id}`,
          required: false,
        };
        break;
      case "factory-zip":
        block = {
          ...block,
          type: "input",
          control_type: "text",
          fieldType: "text",
          label: "Zip Code",
          name: `zip_${block_id}`,
          required: false,
        };
        break;
      case "factory-consent":
        block = {
          ...block,
          type: "checkbox",
          control_type: "checkbox",
          label: "Consent to Contact",
          name: `consent_${block_id}`,
          required: false,
        };
        break;
      default:
        block = { ...(base as Block), dataKey, type: paletteBlock.type };
    }
    return block;
  };

  const addBlock = (paletteBlock: PaletteBlock) => {
    const block = createBlock(paletteBlock);
    setBlocks([...blocks, block]);
    setSelected(block.id);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeData: any = active.data.current;
    if (activeData?.from === "palette") {
      const block = createBlock(activeData.block);
      let index = blocks.length;
      if (over.id !== "canvas") {
        index = blocks.findIndex((b) => b.id === over.id);
        if (index === -1) index = blocks.length;
      }
      const newBlocks = [...blocks];
      newBlocks.splice(index, 0, block);
      setBlocks(newBlocks);
      setSelected(block.id);
    } else {
      if (active.id === over.id) return;
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      let newIndex = blocks.findIndex((b) => b.id === over.id);
      if (over.id === "canvas") newIndex = blocks.length - 1;
      setBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const updateBlock = (updates: Record<string, any>) => {
    if (!selected) return;
    setBlocks(blocks.map((b) => (b.id === selected ? { ...b, ...updates } : b)));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selected === id) setSelected(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (blocks.length === 0) {
      toast.error("At least one field is required.");
      return;
    }
    if (!style.backgroundColor) {
      toast.error("Background color is required.");
      return;
    }
    const seenFactory = new Set<string>();
    const filteredBlocks: Block[] = [];
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      if (b.mapsToFactory) {
        if (seenFactory.has(b.mapsToFactory)) continue;
        seenFactory.add(b.mapsToFactory);
      }
      if ("value" in b && (b.value === undefined || b.value === "")) {
        continue;
      }
      filteredBlocks.unshift(b);
    }

    const payload: any = { title, description, schema_json: { blocks: filteredBlocks, style } };
    if (formId && formId !== "new") payload.id = formId;
    try {
      const saved = await saveForm(payload);
      const returnTo = search.get("returnTo");
      if (returnTo) {
        const url = `${returnTo}?id=${saved.id}`;
        navigate(url);
      } else {
        navigate("/forms");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to save form");
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selected) || null;

  return (
    <PageShell faintFlag>
      <div className="flex flex-col md:flex-row h-full">
        {/* Sidebar palette */}
        <div className="hidden md:block md:w-1/4 border-r overflow-y-auto bg-gray-50">
          <BlockPalette
            onAdd={addBlock}
            background={style.backgroundColor || "#ffffff"}
            onBackgroundChange={(value) => setStyle({ ...style, backgroundColor: value })}
          />
        </div>

        {/* Mobile palette drawer */}
        {showPalette && (
          <div
            className="fixed inset-0 z-50 bg-white p-4 overflow-y-auto md:hidden"
            data-testid="mobile-palette"
          >
            <button onClick={() => setShowPalette(false)} className="mb-4 text-sm text-gray-600">
              Close
            </button>
            <BlockPalette
              onAdd={(b) => {
                addBlock(b);
                setShowPalette(false);
              }}
              background={style.backgroundColor || "#ffffff"}
              onBackgroundChange={(value) => setStyle({ ...style, backgroundColor: value })}
            />
          </div>
        )}

        {/* Preview area */}
        <div className="flex-1 flex flex-col bg-blue-50 md:p-6 overflow-y-auto">
          <div className="mb-4 p-4 bg-white rounded shadow-sm">
            <label htmlFor="form-title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              id="form-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My form title"
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div className="mb-4 p-4 bg-white rounded shadow-sm">
            <label htmlFor="form-description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="form-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full border rounded px-2 py-1"
              rows={3}
            />
          </div>
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div ref={setCanvasRef} id="canvas" className="flex-1 flex justify-center">
                <div
                  className="w-full max-w-md bg-white rounded-xl p-4 shadow-sm"
                  style={{ backgroundColor: style.backgroundColor }}
                >
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
                  {blocks.length === 0 && (
                    <p className="text-center text-sm text-gray-500">Drag fields here</p>
                  )}
                  <div className="mt-4">
                    <button
                      onClick={handleSave}
                      className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Desktop inspector */}
        <div className="hidden md:block md:w-1/4 border-l overflow-y-auto bg-white">
          <PropertyPanel block={selectedBlock} onChange={updateBlock} />
        </div>

        {/* Mobile inspector drawer */}
        {showInspector && (
          <div
            className="fixed inset-0 z-50 bg-white p-4 overflow-y-auto md:hidden"
            data-testid="mobile-inspector"
          >
            <button onClick={() => setShowInspector(false)} className="mb-4 text-sm text-gray-600">
              Close
            </button>
            <PropertyPanel block={selectedBlock} onChange={updateBlock} />
          </div>
        )}
      </div>
    </PageShell>
  );
}
