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
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";

import PageShell from "@/components/PageShell";
import BlockPalette from "@/components/builder/BlockPalette";
import DraggableBlock from "@/components/builder/DraggableBlock";
import PropertyPanel from "@/components/builder/PropertyPanel";
import { fetchForm, saveForm } from "@/services/forms";
import { getCampaigns, Campaign } from "@/services/campaignService";
import { toast } from "react-toastify";

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
  const [style, setStyle] = useState<Record<string, any>>({ backgroundColor: "#ffffff" });
  const [slug, setSlug] = useState("");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
          setSlug(f?.slug || "");
          setCampaignId(f?.campaign_id || null);
        })
        .catch(console.error);
    }
  }, [formId]);

  useEffect(() => {
    getCampaigns()
      .then(setCampaigns)
      .catch((e) => console.error("Failed to load campaigns", e));
  }, []);

  const createBlock = (paletteType: string): Block => {
    const id = uuidv4();
    let block: Block = { id };
    switch (paletteType) {
      case "title":
        block = { id, type: "title", text: "Form Title" };
        break;
      case "description":
        block = { id, type: "description", text: "Form description" };
        break;
      case "text":
        block = {
          id,
          type: "input",
          fieldType: "text",
          label: "Text",
          name: `field_${id}`,
          placeholder: "",
          required: false,
        };
        break;
      case "email":
        block = {
          id,
          type: "input",
          fieldType: "email",
          label: "Email",
          name: `email_${id}`,
          placeholder: "",
          required: false,
        };
        break;
      case "phone":
        block = {
          id,
          type: "input",
          fieldType: "phone",
          label: "Phone",
          name: `phone_${id}`,
          placeholder: "",
          required: false,
        };
        break;
      case "dropdown":
        block = {
          id,
          type: "dropdown",
          label: "Dropdown",
          name: `dropdown_${id}`,
          options: ["Option 1"],
          required: false,
        };
        break;
      case "textarea":
        block = {
          id,
          type: "input",
          fieldType: "textarea",
          label: "Textarea",
          name: `textarea_${id}`,
          placeholder: "",
          required: false,
        };
        break;
      case "checkbox":
        block = {
          id,
          type: "checkbox",
          label: "Checkbox",
          name: `checkbox_${id}`,
          required: false,
        };
        break;
      case "image":
        block = { id, type: "image", url: "", alt: "" };
        break;
      case "link":
        block = {
          id,
          type: "link",
          text: "Website",
          url: "https://",
          required: false,
        };
        break;
      case "pdf":
        block = {
          id,
          type: "pdf",
          url: "",
          displayStyle: "scroll",
          requireAccept: false,
          promptDownload: false,
        };
        break;
      default:
        block = { id, type: paletteType };
    }
    return block;
  };

  const addBlock = (paletteType: string) => {
    const block = createBlock(paletteType);
    setBlocks([...blocks, block]);
    setSelected(block.id);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeData: any = active.data.current;
    if (activeData?.from === "palette") {
      const block = createBlock(activeData.type);
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
    if (!campaignId) {
      toast.error("Please select a campaign before saving.");
      return;
    }
    const payload: any = { schema_json: { blocks, style }, slug, campaign_id: campaignId };
    if (formId && formId !== "new") payload.id = formId;
    try {
      await saveForm(payload);
      navigate("/builder");
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
              onAdd={(type) => {
                addBlock(type);
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
            <label htmlFor="form-campaign" className="block text-sm font-medium mb-1">
              Campaign
            </label>
            <select
              id="form-campaign"
              value={campaignId || ""}
              onChange={(e) => setCampaignId(e.target.value || null)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Select campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 p-4 bg-white rounded shadow-sm">
            <label htmlFor="form-slug" className="block text-sm font-medium mb-1">
              Slug
            </label>
            <input
              id="form-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="unique-form-slug"
              className="w-full border rounded px-2 py-1"
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
