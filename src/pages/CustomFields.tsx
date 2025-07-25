// src/pages/CustomFields.tsx
// ------------------------------------------------------------------------------------
// Legacy CustomFields page kept only so older links/components still compile.
// Prefer /settings/fields (the real builder).
// TODO: Delete this page after all callers move to /settings/fields.
// ------------------------------------------------------------------------------------

import React from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { getFields, saveFields, CustomField } from "@/services/fieldsService";

type SimpleField = {
  id: string;
  label: string;
  visible: boolean;
};

export default function CustomFields() {
  const { user } = useAuth();

  const [fields, setFields] = React.useState<SimpleField[]>([]);
  const [newField, setNewField] = React.useState("");

  React.useEffect(() => {
    const f = getFields()
      .filter((x) => !x.archived)
      .sort((a, b) => a.order - b.order)
      .map<SimpleField>((x) => ({
        id: x.key,
        label: x.label,
        visible: x.visibleOn?.customers ?? true,
      }));
    setFields(f);
  }, [user?.id]);

  const persistToService = (simple: SimpleField[]) => {
    const mapped: CustomField[] = simple.map((s, i) => ({
      id: s.id,
      key: s.id,
      label: s.label,
      type: "text",
      options: [],
      required: false,
      order: i,
      visibleOn: {
        dashboard: true,
        customers: s.visible,
        campaigns: true,
      },
      archived: false,
    }));
    saveFields(mapped);
  };

  const saveAll = () => {
    persistToService(fields);
    alert("Saved (local demo). Use Settings → Fields for the full builder.");
  };

  const resetFields = () => {
    const defaults: SimpleField[] = [
      { id: "name", label: "Name", visible: true },
      { id: "phone", label: "Phone", visible: true },
      { id: "location", label: "Location", visible: true },
    ];
    setFields(defaults);
    persistToService(defaults);
  };

  const addField = () => {
    const label = newField.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, "_");
    if (fields.some((f) => f.id === id)) {
      alert("That key already exists.");
      return;
    }
    setFields([...fields, { id, label, visible: true }]);
    setNewField("");
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleVisibility = (id: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)));
  };

  const moveField = (index: number, dir: "up" | "down") => {
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;
    const next = fields.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setFields(next);
  };

  return (
    <PageShell faintFlag>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-extrabold text-blue-900 mb-6">
            Customize Customer Intake Fields (Legacy)
          </h1>

          <p className="text-sm text-gray-600 mb-6">
            This page is kept for backward compatibility. Prefer using{" "}
            <span className="font-semibold">Settings → Fields</span> for the full feature set.
          </p>

          <div className="mb-6">
          <label className="block font-semibold text-gray-700 mb-2">Add New Field</label>
            <div className="flex gap-3">
              <input
                className="border rounded-xl px-4 py-2 flex-1"
                placeholder="e.g. Favorite Color"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
              />
              <button
                onClick={addField}
                className="bg-blue-600 text-white rounded-xl px-5 py-2 font-semibold hover:bg-blue-700"
              >
                Add Field
              </button>
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No custom fields yet.</div>
          ) : (
            <table className="w-full border rounded-xl overflow-hidden text-sm mb-6">
              <thead className="bg-blue-50 text-left">
                <tr>
                  <th className="p-3">Label</th>
                  <th className="p-3 text-center">Visible</th>
                  <th className="p-3 text-center">Order</th>
                  <th className="p-3 text-center">Remove</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-t hover:bg-blue-50">
                    <td className="p-3">{field.label}</td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={field.visible}
                        onChange={() => toggleVisibility(field.id)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => moveField(index, "up")}
                          disabled={index === 0}
                          className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveField(index, "down")}
                          disabled={index === fields.length - 1}
                          className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded disabled:opacity-50"
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeField(field.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-between mt-6">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold"
              onClick={resetFields}
            >
              Reset to Defaults
            </button>
            <button
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-xl font-bold text-sm"
              onClick={saveAll}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
