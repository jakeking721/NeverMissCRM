// src/pages/Settings/Fields.tsx
// ------------------------------------------------------------------------------------
// Custom Intake Fields (service-backed - now Supabase async)
// - CRUD + reorder + visibility toggles
// - Saves to fieldsService (now Supabase-backed & async)
// ------------------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/PageShell";
import { useAuth } from "../../context/AuthContext";
import { v4 as uuid } from "uuid";
import { getFields, saveFields, CustomField, FieldType } from "../../services/fieldsService";
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiMove, FiInfo } from "react-icons/fi";
import { toKeySlug } from "../../utils/slug";

type DraftField = Omit<CustomField, "id" | "order"> & { id?: string; order?: number };

function normalizeOrders(fields: CustomField[]): CustomField[] {
  return fields
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((f, i) => ({ ...f, order: i }));
}

const emptyDraft: DraftField = {
  key: "",
  label: "",
  type: "text",
  options: [],
  required: false,
  visibleOn: { dashboard: true, customers: true, campaigns: true },
};

export default function Fields() {
  const { user } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [draft, setDraft] = useState<DraftField>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const loaded = await getFields();
        if (!alive) return;
        setFields(normalizeOrders(loaded));
      } catch (e: any) {
        console.error(e);
        setLoadError(e?.message ?? "Failed to load fields");
        setFields([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
      return;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const onStartCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const onStartEdit = (id: string) => {
    const f = fields.find((x) => x.id === id);
    if (!f) return;
    setEditingId(id);
    setDraft({
      ...f,
      options: f.options ?? [],
    });
  };

  const validateDraft = (d: DraftField): string[] => {
    const errs: string[] = [];
    if (!d.label.trim()) errs.push("Label is required");
    if (!d.key.trim()) errs.push("Key is required");
    const collision = fields.find(
      (f) => f.key.toLowerCase() === d.key.toLowerCase() && f.id !== editingId
    );
    if (collision) errs.push(`Key '${d.key}' already exists`);
    if (
      (d.type === "select" || d.type === "multiselect") &&
      (!d.options || d.options.length === 0)
    ) {
      errs.push("Select/multiselect types require at least one option");
    }
    return errs;
  };

  const onSaveDraft = () => {
    const errs = validateDraft(draft);
    if (errs.length) {
      alert("Please fix the following:\n\n" + errs.join("\n"));
      return;
    }

    if (editingId) {
      setFields((prev) => {
        const n = prev.slice();
        const idx = n.findIndex((f) => f.id === editingId);
        if (idx >= 0) {
          n[idx] = {
            ...(n[idx] as CustomField),
            ...draft,
          } as CustomField;
        }
        return normalizeOrders(n);
      });
    } else {
      setFields((prev) =>
        normalizeOrders([
          ...prev,
          {
            id: uuid(),
            order: prev.length,
            ...draft,
          } as CustomField,
        ])
      );
    }

    setEditingId(null);
    setDraft(emptyDraft);
    setIsDirty(true);
  };

  const onDeleteField = (id: string) => {
    if (!confirm("Delete this field? This cannot be undone.")) return;
    setFields((prev) => normalizeOrders(prev.filter((f) => f.id !== id)));
    setIsDirty(true);
  };

  const onToggleVisible = (id: string, key: keyof CustomField["visibleOn"], value: boolean) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              visibleOn: {
                ...f.visibleOn,
                [key]: value,
              },
            }
          : f
      )
    );
    setIsDirty(true);
  };

  const onRequiredToggle = (id: string, required: boolean) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, required } : f)));
    setIsDirty(true);
  };

  const onArchiveToggle = (id: string, archived: boolean) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, archived } : f)));
    setIsDirty(true);
  };

  const onDragStart = (id: string) => setDraggingId(id);
  const onDragOver = (e: React.DragEvent<HTMLTableRowElement>, overId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;

    setFields((prev) => {
      const movingIndex = prev.findIndex((f) => f.id === draggingId);
      const overIndex = prev.findIndex((f) => f.id === overId);
      if (movingIndex === -1 || overIndex === -1) return prev;

      const reordered = prev.slice();
      const [removed] = reordered.splice(movingIndex, 1);
      reordered.splice(overIndex, 0, removed);
      return normalizeOrders(reordered);
    });
    setIsDirty(true);
  };
  const onDragEnd = () => setDraggingId(null);

  const onSaveAll = async () => {
    setSaving(true);
    try {
      await saveFields(fields);
      setIsDirty(false);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Failed to save fields.");
    } finally {
      setSaving(false);
    }
  };

  const visibleFields = useMemo(() => fields.filter((f) => !f.archived), [fields]);

  return (
    <PageShell faintFlag>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Custom Intake Fields</h1>
            <p className="text-sm text-gray-600">
              Add, reorder, and configure which fields appear on the Dashboard, Customers table, and
              Campaigns builder.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp((v) => !v)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-md border text-sm hover:bg-gray-50"
            >
              <FiInfo className="shrink-0" /> Help
            </button>
            <button
              onClick={onSaveAll}
              disabled={!isDirty || saving}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
                isDirty
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <FiSave className="shrink-0" />
              {saving ? "Saving..." : isDirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </div>

        {loadError && (
          <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
            {loadError}
          </div>
        )}

        {showHelp && (
          <div className="p-4 rounded-md bg-white shadow border">
            <h2 className="font-medium mb-2">How this works</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>
                Drag rows by the handle to reorder (this affects Dashboard & Customers forms).
              </li>
              <li>Visibility toggles control where fields appear.</li>
              <li>Select/multiselect fields require options.</li>
            </ul>
          </div>
        )}

        {/* Create / Edit */}
        <div className="p-4 bg-white rounded-md shadow border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">{editingId ? "Edit Field" : "Add Field"}</h2>
            {editingId ? (
              <button
                onClick={() => {
                  setEditingId(null);
                  setDraft(emptyDraft);
                }}
                className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-gray-100"
              >
                <FiX /> Cancel
              </button>
            ) : (
              <button
                onClick={onStartCreate}
                className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-gray-100"
              >
                <FiPlus /> New
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Label */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Label *</label>
              <input
                type="text"
                value={draft.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setDraft((d) => {
                    const autoKey = !!editingId && d.key ? d.key : toKeySlug(label);
                    return { ...d, label, key: autoKey };
                  });
                }}
                className="border rounded px-2 py-1"
                placeholder="e.g. City"
              />
            </div>

            {/* Key */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Key *</label>
              <input
                type="text"
                value={draft.key}
                onChange={(e) => setDraft((d) => ({ ...d, key: toKeySlug(e.target.value) }))}
                className="border rounded px-2 py-1 font-mono text-sm"
                placeholder="city"
              />
            </div>

            {/* Type */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Type</label>
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    type: e.target.value as FieldType,
                    options:
                      e.target.value === "select" || e.target.value === "multiselect"
                        ? (d.options ?? [])
                        : [],
                  }))
                }
                className="border rounded px-2 py-1"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
                <option value="multiselect">Multi-select</option>
              </select>
            </div>

            {/* Options */}
            {(draft.type === "select" || draft.type === "multiselect") && (
              <div className="md:col-span-3">
                <label className="text-sm font-medium mb-1">Options (comma-separated)</label>
                <input
                  type="text"
                  value={(draft.options ?? []).join(", ")}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      options: e.target.value
                        .split(",")
                        .map((o) => o.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Option A, Option B, Option C"
                />
              </div>
            )}

            {/* Required */}
            <div className="flex items-center gap-2">
              <input
                id="required"
                type="checkbox"
                checked={!!draft.required}
                onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))}
              />
              <label htmlFor="required" className="text-sm">
                Required
              </label>
            </div>

            {/* Visibility */}
            <div className="md:col-span-3 flex flex-wrap items-center gap-6">
              <span className="text-sm font-medium">Visibility:</span>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.visibleOn.dashboard}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      visibleOn: { ...d.visibleOn, dashboard: e.target.checked },
                    }))
                  }
                />
                Dashboard
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.visibleOn.customers}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      visibleOn: { ...d.visibleOn, customers: e.target.checked },
                    }))
                  }
                />
                Customers
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.visibleOn.campaigns}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      visibleOn: { ...d.visibleOn, campaigns: e.target.checked },
                    }))
                  }
                />
                Campaigns
              </label>
            </div>

            <div className="md:col-span-3">
              <button
                onClick={onSaveDraft}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <FiSave /> {editingId ? "Update Field" : "Add Field"}
              </button>
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="p-4 bg-white rounded-md shadow border">
          <h2 className="text-lg font-medium mb-4">Active Fields</h2>

          {loading ? (
            <p className="text-sm text-gray-600">Loading fields…</p>
          ) : visibleFields.length === 0 ? (
            <p className="text-sm text-gray-600">No fields yet. Create one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 w-8"></th>
                    <th className="py-2">Label</th>
                    <th className="py-2">Key</th>
                    <th className="py-2">Type</th>
                    <th className="py-2 text-center">Req</th>
                    <th className="py-2 text-center">Dash</th>
                    <th className="py-2 text-center">Cust</th>
                    <th className="py-2 text-center">Camp</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFields.map((f) => (
                    <tr
                      key={f.id}
                      draggable
                      onDragStart={() => onDragStart(f.id)}
                      onDragOver={(e) => onDragOver(e, f.id)}
                      onDragEnd={onDragEnd}
                      className={`border-b hover:bg-gray-50 ${
                        draggingId === f.id ? "opacity-50" : ""
                      }`}
                    >
                      <td className="py-2 align-middle">
                        <span className="cursor-move inline-flex p-1 text-gray-400 hover:text-gray-600">
                          <FiMove />
                        </span>
                      </td>
                      <td className="py-2 align-middle">{f.label}</td>
                      <td className="py-2 align-middle font-mono text-xs">{f.key}</td>
                      <td className="py-2 align-middle">{f.type}</td>
                      <td className="py-2 align-middle text-center">
                        <input
                          type="checkbox"
                          checked={!!f.required}
                          onChange={(e) => onRequiredToggle(f.id, e.target.checked)}
                        />
                      </td>
                      <td className="py-2 align-middle text-center">
                        <input
                          type="checkbox"
                          checked={f.visibleOn.dashboard}
                          onChange={(e) => onToggleVisible(f.id, "dashboard", e.target.checked)}
                        />
                      </td>
                      <td className="py-2 align-middle text-center">
                        <input
                          type="checkbox"
                          checked={f.visibleOn.customers}
                          onChange={(e) => onToggleVisible(f.id, "customers", e.target.checked)}
                        />
                      </td>
                      <td className="py-2 align-middle text-center">
                        <input
                          type="checkbox"
                          checked={f.visibleOn.campaigns}
                          onChange={(e) => onToggleVisible(f.id, "campaigns", e.target.checked)}
                        />
                      </td>
                      <td className="py-2 align-middle text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => onStartEdit(f.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            onClick={() => onArchiveToggle(f.id, true)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-500"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => onDeleteField(f.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 text-red-600"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Archived */}
          {fields.some((f) => f.archived) && (
            <div className="mt-8">
              <h2 className="text-lg font-medium mb-2">Archived</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Label</th>
                    <th className="py-2">Key</th>
                    <th className="py-2">Type</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields
                    .filter((f) => f.archived)
                    .map((f) => (
                      <tr key={f.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">{f.label}</td>
                        <td className="py-2 font-mono text-xs">{f.key}</td>
                        <td className="py-2">{f.type}</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => onArchiveToggle(f.id, false)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
