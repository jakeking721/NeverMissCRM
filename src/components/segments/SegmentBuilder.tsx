// src/components/segments/SegmentBuilder.tsx
// ------------------------------------------------------------------------------------
// Simple segment builder for filtering customers by custom fields (local only).
// Supports:
//   - equals
//   - contains
//   - greaterThan / lessThan (numbers)
//   - isTrue / isFalse (booleans)
//
// TODO:
// - Nested groups
// - Between ranges for numbers/dates
// - Server-side query builder
// ------------------------------------------------------------------------------------

import React from "react";
import { CustomField, FieldType } from "../../services/fieldsService";

export type Operator = "equals" | "contains" | "greaterThan" | "lessThan" | "isTrue" | "isFalse";

export type SegmentRule = {
  id: string;
  fieldKey: string;
  operator: Operator;
  value?: string; // for operators that need it
};

export type Segment = {
  rules: SegmentRule[];
  match: "all" | "any";
};

type Props = {
  fields: CustomField[];
  segment: Segment;
  onChange: (segment: Segment) => void;
};

const OPERATORS_BY_TYPE: Record<FieldType, Operator[]> = {
  text: ["equals", "contains"],
  email: ["equals", "contains"],
  phone: ["equals", "contains"],
  number: ["equals", "greaterThan", "lessThan"],
  date: ["equals", "greaterThan", "lessThan"],
  boolean: ["isTrue", "isFalse"],
  select: ["equals", "contains"],
  multiselect: ["contains"],
};

export default function SegmentBuilder({ fields, segment, onChange }: Props) {
  const addRule = () => {
    const firstField = fields[0];
    const ops: Operator[] = firstField
      ? (OPERATORS_BY_TYPE[firstField.type] ?? ["equals"])
      : ["equals"];
    const firstOp: Operator = (ops[0] ?? "equals") as Operator;

    const newRule: SegmentRule = {
      id: crypto.randomUUID(),
      fieldKey: firstField?.key ?? "",
      operator: firstOp,
      value: "",
    };

    onChange({
      ...segment,
      rules: [...segment.rules, newRule],
    });
  };

  const updateRule = (id: string, patch: Partial<SegmentRule>) => {
    onChange({
      ...segment,
      rules: segment.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const removeRule = (id: string) => {
    onChange({
      ...segment,
      rules: segment.rules.filter((r) => r.id !== id),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters (Segment)</h3>
        <div className="flex items-center gap-2">
          <select
            value={segment.match}
            onChange={(e) => onChange({ ...segment, match: e.target.value as "all" | "any" })}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="all">Match all</option>
            <option value="any">Match any</option>
          </select>
          <button onClick={addRule} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">
            + Add rule
          </button>
        </div>
      </div>

      {segment.rules.length === 0 ? (
        <p className="text-xs text-gray-500">No rules. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {segment.rules.map((rule) => {
            const field = fields.find((f) => f.key === rule.fieldKey);
            const ops: Operator[] = field
              ? (OPERATORS_BY_TYPE[field.type] ?? ["equals"])
              : ["equals"];

            return (
              <div key={rule.id} className="flex flex-wrap items-center gap-2 p-2 border rounded">
                {/* Field */}
                <select
                  value={rule.fieldKey}
                  onChange={(e) => updateRule(rule.id, { fieldKey: e.target.value })}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={rule.operator}
                  onChange={(e) =>
                    updateRule(rule.id, {
                      operator: e.target.value as Operator,
                    })
                  }
                  className="border rounded px-2 py-1 text-sm"
                >
                  {ops.map((op) => (
                    <option key={op} value={op}>
                      {humanOp(op)}
                    </option>
                  ))}
                </select>

                {/* Value (only for ops that need it) */}
                {needsValue(rule.operator) && (
                  <input
                    type="text"
                    value={rule.value ?? ""}
                    onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                    className="border rounded px-2 py-1 text-sm"
                    placeholder="value…"
                  />
                )}

                <button
                  onClick={() => removeRule(rule.id)}
                  className="ml-auto text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

function humanOp(op: Operator) {
  switch (op) {
    case "equals":
      return "equals";
    case "contains":
      return "contains";
    case "greaterThan":
      return "greater than";
    case "lessThan":
      return "less than";
    case "isTrue":
      return "is true";
    case "isFalse":
      return "is false";
    default:
      return op;
  }
}

function needsValue(op: Operator) {
  return !["isTrue", "isFalse"].includes(op);
}
