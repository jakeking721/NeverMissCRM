import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import {
  getCustomer,
  updateCustomer,
  type Customer,
} from "@/services/customerService";
import {
  getFields,
  addField,
  type CustomField,
  type FieldType,
} from "@/services/fieldsService";
import { toKeySlug } from "@/utils/slug";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, ready } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const [addingField, setAddingField] = useState(false);
  const [newField, setNewField] = useState<{ label: string; type: FieldType; options: string }>(
    { label: "", type: "text", options: "" }
  );

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate("/login");
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [cust, flds] = await Promise.all([getCustomer(id), getFields()]);
      if (cust) {
        setCustomer(cust);
        setValues(cust);
      }
      setFields(
        flds
          .filter((f) => !f.archived && f.visibleOn.customers)
          .sort((a, b) => a.order - b.order)
      );
    })();
  }, [id]);

  const handleChange = (key: string, value: any) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const renderInput = (f: { key: string; label: string; type: FieldType; options?: string[] }) => {
    const common = "border rounded px-3 py-2 w-full";
    switch (f.type) {
      case "boolean":
        return (
          <select
            className={common}
            value={
              values[f.key] === undefined
                ? ""
                : values[f.key]
                ? "true"
                : "false"
            }
            onChange={(e) => handleChange(f.key, e.target.value === "true")}
          >
            <option value="" disabled>
              Select...
            </option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      case "select":
        return (
          <select
            className={common}
            value={values[f.key] ?? ""}
            onChange={(e) => handleChange(f.key, e.target.value)}
          >
            <option value=""></option>
            {f.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case "multiselect":
        return (
          <select
            className={common}
            multiple
            value={(values[f.key] as string[]) ?? []}
            onChange={(e) =>
              handleChange(
                f.key,
                Array.from(e.currentTarget.selectedOptions).map((o) => o.value)
              )
            }
          >
            {f.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      default: {
        let type: string = "text";
        if (f.type === "number") type = "number";
        else if (f.type === "date") type = "date";
        else if (f.type === "email") type = "email";
        else if (f.type === "phone") type = "tel";
        return (
          <input
            type={type}
            className={common}
            value={values[f.key] ?? ""}
            onChange={(e) => handleChange(f.key, e.target.value)}
          />
        );
      }
    }
  };

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      const patch = { ...values };
      delete patch.id;
      delete patch.user_id;
      await updateCustomer(customer.id, patch);
      navigate("/customers");
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = async () => {
    const key = toKeySlug(newField.label);
    await addField({
      id: uuid(),
      key,
      label: newField.label,
      type: newField.type,
      options:
        newField.type === "select" || newField.type === "multiselect"
          ? newField.options
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
      required: false,
      order: fields.length + 1,
      visibleOn: { dashboard: false, customers: true, campaigns: false },
      archived: false,
    });
    const flds = await getFields();
    setFields(
      flds
        .filter((f) => !f.archived && f.visibleOn.customers)
        .sort((a, b) => a.order - b.order)
    );
    setValues((v) => ({ ...v, [key]: "" }));
    setNewField({ label: "", type: "text", options: "" });
    setAddingField(false);
  };

  return (
    <PageShell>
      <div className="max-w-screen-md mx-auto px-4 space-y-6">
        <h1 className="text-xl font-semibold">Customer Detail</h1>

        {customer ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={values.name ?? ""}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                className="border rounded px-3 py-2 w-full"
                type="tel"
                value={values.phone ?? ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={values.location ?? ""}
                onChange={(e) => handleChange("location", e.target.value)}
              />
            </div>

            {fields.map((f) => (
              <div key={f.id}>
                <label className="block text-sm font-medium mb-1">{f.label}</label>
                {renderInput(f)}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="px-4 py-2 rounded-md border hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p>Loading...</p>
        )}

        <div>
          {addingField ? (
            <div className="border rounded-md p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={newField.label}
                  onChange={(e) =>
                    setNewField((nf) => ({ ...nf, label: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={newField.type}
                  onChange={(e) =>
                    setNewField((nf) => ({ ...nf, type: e.target.value as FieldType }))
                  }
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="boolean">Yes/No</option>
                  <option value="select">Select</option>
                  <option value="multiselect">Multi-select</option>
                </select>
              </div>
              {(newField.type === "select" || newField.type === "multiselect") && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Options (comma-separated)
                  </label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={newField.options}
                    onChange={(e) =>
                      setNewField((nf) => ({ ...nf, options: e.target.value }))
                    }
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Field
                </button>
                <button
                  type="button"
                  onClick={() => setAddingField(false)}
                  className="px-4 py-2 rounded-md border hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingField(true)}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              Add Field
            </button>
          )}
        </div>
      </div>
    </PageShell>
  );
}

