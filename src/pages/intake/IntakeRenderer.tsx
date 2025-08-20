// src/pages/intake/IntakeRenderer.tsx
// -----------------------------------------------------------------------------
// Renders a campaign intake form from JSON schema
// - Fetches campaign_forms.schema_json by :campaignId / :formSlug
// - Supports blocks: Text, Image, Input (text/email/phone), Choice, Button, PDF, Link
// - Validates inputs with Yup and submits via services/intake.submitIntake
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as yup from "@/utils/yup";
import { formatPhone, normalizePhone } from "@/utils/phone";

import { supabase } from "@/utils/supabaseClient";
import { submitIntake } from "@/services/intake";
import Success from "./Success";

interface RouteParams extends Record<string, string | undefined> {
  campaignId?: string;
  formSlug?: string;
}

interface BaseBlock {
  id: string;
  type: string;
}
interface TextBlock extends BaseBlock {
  type: "text";
  text: string;
}
interface ImageBlock extends BaseBlock {
  type: "image";
  url: string;
  alt?: string;
}
interface InputBlock extends BaseBlock {
  type: "input";
  name: string;
  label?: string;
  inputType: "text" | "email" | "phone";
  required?: boolean;
}
interface ChoiceBlock extends BaseBlock {
  type: "choice";
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
}
interface ButtonBlock extends BaseBlock {
  type: "button";
  text: string;
}
interface PdfBlock extends BaseBlock {
  type: "pdf";
  url: string;
  required?: boolean;
}
interface LinkBlock extends BaseBlock {
  type: "link";
  text: string;
  url: string;
  required?: boolean;
}
interface CheckboxBlock extends BaseBlock {
  type: "checkbox";
  name: string;
  label?: string;
  required?: boolean;
}
interface MultiSelectBlock extends BaseBlock {
  type: "multiselect";
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
}

type Block =
  | TextBlock
  | ImageBlock
  | InputBlock
  | ChoiceBlock
  | ButtonBlock
  | PdfBlock
  | LinkBlock
  | CheckboxBlock
  | MultiSelectBlock;

export default function IntakeRenderer() {
  const { campaignId = "", formSlug = "" } = useParams<RouteParams>();
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
          if (b.type === "input" || b.type === "choice") initVals[b.name] = "";
          if (b.type === "checkbox") initVals[b.name] = false;
          if (b.type === "multiselect") initVals[b.name] = [];
          if ((b.type === "pdf" || b.type === "link") && b.required)
            initVals[`ack_${b.id}`] = false;
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
        if (b.inputType === "phone") validator = validator.test("phone", "Invalid phone", (v) => !!normalizePhone(v ?? ""));
        if (b.required) validator = validator.required("Required");
        shape[b.name] = validator;
      }
      if (b.type === "choice") {
        let validator = yup.string();
        if (b.required) validator = validator.required("Required");
        shape[b.name] = validator;
      }
      if ((b.type === "pdf" || b.type === "link") && b.required) {
        shape[`ack_${b.id}`] = yup.boolean().oneOf([true], "Required");
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
        if (b.type === "checkbox" && b.required && !values[b.name]) {
          arrayErrors[b.name] = "Required";
        }
        if (
          b.type === "multiselect" &&
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
      const { first_name, last_name, phone, zip_code, ...extra } = valid as Record<string, any>;
      await submitIntake({
        slug: formSlug,
        firstName: first_name,
        lastName: last_name,
        phone,
        zipCode: zip_code,
        extra,
      });
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
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  if (submitted) {
    return <Success />;
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-6 rounded shadow">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {blocks.map((block) => {
            switch (block.type) {
              case "text":
                return (
                  <p key={block.id} className="text-gray-700">
                    {block.text}
                  </p>
                );
              case "image":
                return (
                  <img key={block.id} src={block.url} alt={block.alt || ""} className="w-full" />
                );
              case "input":
                return (
                  <div key={block.id}>
                    {block.label && (
                      <label className="block text-sm font-medium mb-1">
                        {block.label}
                        {block.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    )}
                    <input
                      type={block.inputType === "phone" ? "tel" : block.inputType}
                      value={
                        block.inputType === "phone"
                          ? formatPhone(values[block.name] || "")
                          : values[block.name] || ""
                      }
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [block.name]:
                            block.inputType === "phone"
                              ? normalizePhone(e.target.value)
                              : e.target.value,
                        })
                      }
                      className="w-full border rounded p-2"
                    />
                    {fieldErrors[block.name] && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors[block.name]}</p>
                    )}
                  </div>
                );
              case "choice":
                return (
                  <div key={block.id}>
                    {block.label && (
                      <label className="block text-sm font-medium mb-1">
                        {block.label}
                        {block.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    )}
                    <select
                      value={values[block.name] || ""}
                      onChange={(e) => setValues({ ...values, [block.name]: e.target.value })}
                      className="w-full border rounded p-2"
                    >
                      <option value="">Select…</option>
                      {(block.options || []).map((o, i) => (
                        <option key={i} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    {fieldErrors[block.name] && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors[block.name]}</p>
                    )}
                  </div>
                );
              case "checkbox":
                return (
                  <div key={block.id}>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!!values[block.name]}
                        onChange={(e) =>
                          setValues({ ...values, [block.name]: e.target.checked })
                        }
                      />
                      <span className="ml-2">
                        {block.label}
                        {block.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </label>
                    {fieldErrors[block.name] && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors[block.name]}</p>
                    )}
                  </div>
                );
              case "multiselect":
                return (
                  <div key={block.id}>
                    {block.label && (
                      <label className="block text-sm font-medium mb-1">
                        {block.label}
                        {block.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    )}
                    <select
                      multiple
                      value={values[block.name] || []}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [block.name]: Array.from(e.target.selectedOptions).map(
                            (o) => o.value
                          ),
                        })
                      }
                      className="w-full border rounded p-2"
                    >
                      {(block.options || []).map((o, i) => (
                        <option key={i} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    {fieldErrors[block.name] && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors[block.name]}</p>
                    )}
                  </div>
                );
              case "button":
                return (
                  <button
                    key={block.id}
                    type="submit"
                    className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800"
                  >
                    {block.text}
                  </button>
                );
              case "pdf":
                return (
                  <div key={block.id}>
                    <iframe src={block.url} className="w-full h-64 border" />
                    {block.required && (
                      <label className="flex items-center mt-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!values[`ack_${block.id}`]}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              [`ack_${block.id}`]: e.target.checked,
                            })
                          }
                        />
                        <span className="ml-2">I acknowledge</span>
                      </label>
                    )}
                    {fieldErrors[`ack_${block.id}`] && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors[`ack_${block.id}`]}</p>
                    )}
                  </div>
                );
              case "link":
                return (
                  <div key={block.id}>
                    <a
                      href={block.url}
                      className="text-blue-600 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {block.text}
                    </a>
                    {block.required && (
                      <label className="flex items-center mt-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!values[`ack_${block.id}`]}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              [`ack_${block.id}`]: e.target.checked,
                            })
                          }
                        />
                        <span className="ml-2">I acknowledge</span>
                      </label>
                    )}
                    {fieldErrors[`ack_${block.id}`] && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors[`ack_${block.id}`]}</p>
                    )}
                  </div>
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
