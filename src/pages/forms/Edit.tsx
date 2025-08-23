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
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";

import PageShell from "@/components/PageShell";
import BlockPalette, { PaletteBlock } from "@/components/builder/BlockPalette";
import DraggableBlock from "@/components/builder/DraggableBlock";
import PropertyPanel from "@/components/builder/PropertyPanel";
import { fetchForm, saveForm } from "@/services/forms";
import {
  getFields,
  addField,
  CustomField,
  FieldType,
} from "@/services/fieldsService";
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
  fieldName?: string;
  [key: string]: any;
}

export default function FormBuilder() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [style, setStyle] = useState<Record<string, any>>({
    backgroundColor: "#ffffff",
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const [registryFields, setRegistryFields] = useState<CustomField[]>([]);
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

  useEffect(() => {
    getFields().then(setRegistryFields).catch(console.error);
  }, []);

  /**
   * Ensure generic palette items that should map to factory columns
   * (e.g., Phone/Email) do so even if they aren’t the explicit factory-* types.
   */
  const inferFactoryKey = (paletteBlock: PaletteBlock): string | null => {
    if ((paletteBlock as any)?.factoryKey) return (paletteBlock as any).factoryKey;

    switch (paletteBlock.type) {
      case "phone":
      case "factory-phone":
        return "phone";
      case "email":
      case "factory-email":
        return "email";
      case "factory-first-name":
        return "first_name";
      case "factory-last-name":
        return "last_name";
      case "factory-zip":
        return "zip_code";
      case "factory-consent":
        return "consent_to_contact";
      default:
        return null;
    }
  };

  const createBlock = (paletteBlock: PaletteBlock): Block => {
    const block_id = uuidv4();
    const mapsToFactory = inferFactoryKey(paletteBlock);
    const dataKey = mapsToFactory ? `f.${mapsToFactory}` : `c.${block_id}`;

    const base: Partial<Block> = {
      id: block_id,
      block_id,
      mapsToFactory,
      control_type: paletteBlock.type,
      saveToLatest: true,
      dataKey,
    };

    let block: Block = { ...(base as Block), type: paletteBlock.type };

    switch (paletteBlock.type) {
      case "title":
        block = {
          ...block,
          type: "title",
          control_type: "title",
          text: "Form Title",
        };
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
          fieldName: "",
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
          fieldName: "",
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
          fieldName: "",
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
          fieldName: "",
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
          fieldName: "",
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
          fieldName: "",
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

      // Explicit factory palette items
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
    if (isPreview) return; // disable reordering in preview
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

    // Existing registry keys
    const existing = new Set(registryFields.map((f) => f.key));
    const newFields: CustomField[] = [];

    // Last-wins for factory mappings; register custom fields; assign r.<fieldName>
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];

      // De-dup factory mappings (last instance wins)
      if (b.mapsToFactory) {
        if (seenFactory.has(b.mapsToFactory)) continue;
        seenFactory.add(b.mapsToFactory);
      }

      // Custom fields must have a name and be registered once
      if (!b.mapsToFactory) {
        if (!b.fieldName || !b.fieldName.trim()) {
          toast.error("Field name is required for custom fields.");
          return;
        }
        const key = b.fieldName.trim();

        if (!existing.has(key)) {
          const fType: FieldType =
            b.control_type === "phone"
              ? "phone"
              : b.control_type === "email"
              ? "email"
              : b.control_type === "checkbox"
              ? "boolean"
              : b.type === "dropdown"
              ? "select"
              : "text";

          const nf: CustomField = {
            id: uuidv4(),
            key,
            label: b.label || key,
            type: fType,
            options: b.options || [],
            required: false,
            order: registryFields.length + newFields.length,
            visibleOn: { dashboard: true, customers: true, campaigns: true },
          };

          newFields.push(nf);
          existing.add(key);
        }

        // Point the block at the registry key space
        b.dataKey = `r.${key}`;
      }

      // Drop purely decorative empty value props if present
      if ("value" in b && (b.value === undefined || b.value === "")) {
        // ignore naked empty value-only adornments
      }

      filteredBlocks.unshift(b);
    }

    // Persist any newly defined registry fields
    for (const nf of newFields) {
      try {
        await addField(nf);
      } catch (e) {
        console.error(e);
      }
    }
    if (newFields.length) setRegistryFields([...registryFields, ...newFields]);

    const payload: any = {
      title,
      description,
      schema_json: { blocks: filteredBlocks, style },
    };
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
      {/* Sticky header toolbar */}
      <div className="border-b bg-white/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              Intake Form Builder
            </h1>
            {isPreview && (
              <span className="text-xs rounded-full px-2 py-1 bg-blue-100 text-blue-700">
                Preview mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreview((v) => !v)}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
              title="Preview"
            >
              {isPreview ? "Exit Preview" : "Preview"}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm shadow hover:bg-green-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 px-0 md:px-4 py-4 md:py-6">
        {/* Left: Add Fields */}
        <aside className="md:col-span-3 border-b md:border-b-0 md:border-r bg-gray-50/70">
          <div className="sticky top-[56px] md:top-[60px] h-[calc(100vh-56px)] md:h-[calc(100vh-60px)] overflow-y-auto p-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Add Fields</h2>
              <p className="text-xs text-gray-500">
                Factory fields map to customer columns. Custom fields are saved
                to your registry.
              </p>
            </div>
            <div className="rounded-xl border bg-white shadow-sm">
              <BlockPalette
                onAdd={addBlock}
                background={style.backgroundColor || "#ffffff"}
                onBackgroundChange={(value) =>
                  setStyle({ ...style, backgroundColor: value })
                }
              />
            </div>
          </div>
        </aside>

        {/* Center: Canvas */}
        <main className="md:col-span-6 bg-blue-50/60">
          <div className="p-4 md:p-6">
            {/* Title card */}
            <div className="mb-4 p-4 md:p-5 bg-white rounded-2xl shadow-sm border">
              <label
                htmlFor="form-title"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Title
              </label>
              <input
                id="form-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My form title"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Description card */}
            <div className="mb-4 p-4 md:p-5 bg-white rounded-2xl shadow-sm border">
              <label
                htmlFor="form-description"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="form-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                rows={3}
              />
            </div>

            {/* Canvas card */}
            <div className="p-4 md:p-5 bg-white rounded-2xl shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">Drag fields here</p>
                <div className="flex items-center gap-2 md:hidden">
                  <button
                    onClick={() => setShowPalette(true)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    Blocks
                  </button>
                  {selectedBlock && (
                    <button
                      onClick={() => setShowInspector(true)}
                      className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm"
                    >
                      Props
                    </button>
                  )}
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    ref={setCanvasRef}
                    id="canvas"
                    className={[
                      "flex justify-center",
                      isPreview ? "pointer-events-none opacity-[0.98]" : "",
                    ].join(" ")}
                  >
                    <div
                      className="w-full max-w-lg bg-white rounded-xl p-4 border"
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
                        <p className="text-center text-sm text-gray-400">
                          Drag fields here
                        </p>
                      )}
                    </div>
                  </div>
                </SortableContext>
              </DndContext>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => setIsPreview((v) => !v)}
                  className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                  {isPreview ? "Exit Preview" : "Preview"}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm shadow hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Right: Block Settings */}
        <aside className="md:col-span-3 border-t md:border-t-0 md:border-l bg-white">
          <div className="sticky top-[56px] md:top-[60px] h-[calc(100vh-56px)] md:h-[calc(100vh-60px)] overflow-y-auto p-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-700">
                Block Settings
              </h2>
              <p className="text-xs text-gray-500">
                Configure the selected field. Map to a factory field here if
                needed.
              </p>
            </div>
            <div className="rounded-2xl border bg-white shadow-sm">
              <PropertyPanel block={selectedBlock} onChange={updateBlock} />
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile palette drawer */}
      {showPalette && (
        <div
          className="fixed inset-0 z-[60] bg-white p-4 overflow-y-auto md:hidden"
          data-testid="mobile-palette"
        >
          <button
            onClick={() => setShowPalette(false)}
            className="mb-4 text-sm text-gray-600"
          >
            Close
          </button>
          <BlockPalette
            onAdd={(b) => {
              addBlock(b);
              setShowPalette(false);
            }}
            background={style.backgroundColor || "#ffffff"}
            onBackgroundChange={(value) =>
              setStyle({ ...style, backgroundColor: value })
            }
          />
        </div>
      )}

      {/* Mobile inspector drawer */}
      {showInspector && (
        <div
          className="fixed inset-0 z-[60] bg-white p-4 overflow-y-auto md:hidden"
          data-testid="mobile-inspector"
        >
          <button
            onClick={() => setShowInspector(false)}
            className="mb-4 text-sm text-gray-600"
          >
            Close
          </button>
          <PropertyPanel block={selectedBlock} onChange={updateBlock} />
        </div>
      )}
    </PageShell>
  );
}
