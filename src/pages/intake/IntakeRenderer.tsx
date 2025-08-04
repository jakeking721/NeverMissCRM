// src/pages/intake/IntakeRenderer.tsx
// -----------------------------------------------------------------------------
// Renders a campaign intake form from JSON schema
// - Fetches campaign_forms.schema_json by :campaignId / :formSlug
// - Supports blocks: Text, Image, Input (text/email/phone), Checkbox, Multi-Select,
//   Button, PDF, Link
// - Validates inputs with Yup and submits via services/intake.submitIntake
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as yup from "@/utils/yup";

import { supabase } from "@/utils/supabaseClient";
import { submitIntake } from "@/services/intake";
import Success from "./Success";

interface RouteParams {
  campaignId: string;
  formSlug: string;
}

interface TextBlock { type: "text"; text: string; }
interface ImageBlock { type: "image"; url: string; alt?: string; }
interface InputBlock {
  type: "input";
  name: string;
  label?: string;
  inputType: "text" | "email" | "phone";
  required?: boolean;
}
interface CheckboxBlock {
  type: "checkbox";
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
}
interface MultiSelectBlock {
  type: "multiselect";
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
}
interface ButtonBlock { type: "button"; text: string; }
interface PdfBlock { type: "pdf"; url: string; }
interface LinkBlock { type: "link"; text: string; url: string; }

type Block =
  | TextBlock
  | ImageBlock
  | InputBlock
  | CheckboxBlock
  | MultiSelectBlock
  | ButtonBlock
  | PdfBlock
  | LinkBlock;

export default function IntakeRenderer() {
  const { campaignId, formSlug } = useParams<RouteParams>();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("campaign_forms")
          .select("schema_json")
          .eq("campaign_id", campaignId)
          .eq("slug", formSlug)
          .single();
        if (!mounted) return;
        if (error || !data) {
          setError("Form not found");
          setLoading(false);
          return;
        }
        const schemaBlocks: Block[] = data.schema_json?.blocks ?? [];
        setBlocks(schemaBlocks);
        const initVals: Record<string, any> = {};
        schemaBlocks.forEach((b) => {
          if (b.type === "input") initVals[b.name] = "";
          if (b.type === "checkbox" || b.type === "multiselect") initVals[b.name] = [];
        });
        setValues(initVals);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load form");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [campaignId, formSlug]);

  const buildValidation = () => {
    const shape: Record<string, any> = {};
    blocks.forEach((b) => {
      if (b.type === "input") {
        let validator = yup.string();
        if (b.inputType === "email") validator = validator.email("Invalid email");
        if (b.inputType === "phone")
          validator = validator.matches(/^[0-9()+\-\s]+$/u, "Invalid phone");
        if (b.required) validator = validator.required("Required");
        shape[b.name] = validator;
      }
    });
    return yup.object().shape(shape);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);
    try {
      const schema = buildValidation();
      const valid = await schema.validate(values, { abortEarly: false });
      const arrayErrors: Record<string, string> = {};
      blocks.forEach((b) => {
        if (
          (b.type === "checkbox" || b.type === "multiselect") &&
          b.required &&
          (!values[b.name] || values[b.name].length === 0)
        ) {
          arrayErrors[b.name] = "Required";
        }
      });
      if (Object.keys(arrayErrors).length) {
        setFieldErrors(arrayErrors);
        return;
      }
      await submitIntake(valid);
      setSubmitted(true);
    } catch (err: any) {
      if (err.name === "ValidationError") {
        const vErrs: Record<string, string> = {};
        err.inner.forEach((ve: any) => {
          if (ve.path) vErrs[ve.path] = ve.message;
        });
        setFieldErrors(vErrs);
      } else {
        setError(err.message || "Failed to submit");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading…</div>
    );
  }

  if (submitted) {
    return <Success />;
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-6 rounded shadow">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {blocks.map((block, idx) => {
            switch (block.type) {
              case "text":
                return (
                  <p key={idx} className="text-gray-700">
                    {block.text}
                  </p>
                );
              case "image":
                return (
                  <img
                    key={idx}
                    src={block.url}
                    alt={block.alt || ""}
                    className="w-full"
                  />
                );
              case "input":
                return (
                  <div key={block.name}>
                    {block.label && (
                      <label className="block text-sm font-medium mb-1">
                        {block.label}
                      </label>
                    )}
                    <input
                      type={
                        block.inputType === "phone" ? "tel" : block.inputType
                      }
                      value={values[block.name] || ""}
                      onChange={(e) =>
                        setValues({ ...values, [block.name]: e.target.value })
                      }
                      className="w-full border rounded p-2"
                    />
                    {fieldErrors[block.name] && (
                      <p className="text-xs text-red-600 mt-1">
                        {fieldErrors[block.name]}
                      </p>
                    )}
                  </div>
                );
              case "checkbox":
                return (
                  <div key={block.name}>
                    {block.label && (
                      <span className="block text-sm font-medium mb-1">
                        {block.label}
                      </span>
                    )}
                    <div className="space-y-1">
                      {block.options.map((o, i) => (
                        <label key={i} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={values[block.name]?.includes(o)}
                            onChange={(e) => {
                              const current: string[] = values[block.name] || [];
                              const next = e.target.checked
                                ? [...current, o]
                                : current.filter((v) => v !== o);
                              setValues({ ...values, [block.name]: next });
                            }}
                          />
                          <span>{o}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors[block.name] && (
                      <p className="text-xs text-red-600 mt-1">
                        {fieldErrors[block.name]}
                      </p>
                    )}
                  </div>
                );
              case "multiselect":
                return (
                  <div key={block.name}>
                    {block.label && (
                      <label className="block text-sm font-medium mb-1">
                        {block.label}
                      </label>
                    )}
                    <select
                      multiple
                      value={values[block.name] || []}
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions,
                          (opt) => opt.value
                        );
                        setValues({ ...values, [block.name]: selected });
                      }}
                      className="w-full border rounded p-2 h-24"
                    >
                      {block.options.map((o, i) => (
                        <option key={i}>{o}</option>
                      ))}
                    </select>
                    {fieldErrors[block.name] && (
                      <p className="text-xs text-red-600 mt-1">
                        {fieldErrors[block.name]}
                      </p>
                    )}
                  </div>
                );
              case "button":
                return (
                  <button
                    key={idx}
                    type="submit"
                    className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800"
                  >
                    {block.text}
                  </button>
                );
              case "pdf":
                return (
                  <iframe
                    key={idx}
                    src={block.url}
                    className="w-full h-64 border"
                  />
                );
              case "link":
                return (
                  <a
                    key={idx}
                    href={block.url}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {block.text}
                  </a>
                );
              default:
                return null;
            }
          })}
          <p className="text-[10px] text-gray-500 text-center">
            Reply STOP to opt out at any time.
          </p>
        </form>
      </div>
    </div>
  );
}
