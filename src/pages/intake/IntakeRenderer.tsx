// src/pages/intake/IntakeRenderer.tsx
// -----------------------------------------------------------------------------
// Renders a campaign intake form from JSON schema
// - Loads campaign by slug and renders snapshot or template
// - Supports blocks: Text, Image, Input (text/email/phone), Choice, Button, PDF, Link
// - Validates inputs with Yup and submits via services/intake.submitIntake
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import * as yup from "@/utils/yup";
import { formatPhone, normalizePhone } from "@/utils/phone";

import { supabase } from "@/utils/supabaseClient";
import { submitIntake } from "@/services/intake";
import Success from "./Success";

interface RouteParams extends Record<string, string | undefined> {
  slug?: string;
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
  dataKey?: string;
  fieldName?: string;
}
interface ChoiceBlock extends BaseBlock {
  type: "choice";
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
  dataKey?: string;
  fieldName?: string;
}
interface DropdownBlock extends BaseBlock {
  type: "dropdown";
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
  dataKey?: string;
  fieldName?: string;
}
interface SingleChoiceBlock extends BaseBlock {
  type: "single-choice";
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
  dataKey?: string;
  fieldName?: string;
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
  dataKey?: string;
  fieldName?: string;
}
interface MultiSelectBlock extends BaseBlock {
  type: "multiselect";
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
  dataKey?: string;
  fieldName?: string;
}

type Block =
  | TextBlock
  | ImageBlock
  | InputBlock
  | ChoiceBlock
  | DropdownBlock
  | SingleChoiceBlock
  | ButtonBlock
  | PdfBlock
  | LinkBlock
  | CheckboxBlock
  | MultiSelectBlock;

export default function IntakeRenderer() {
  const { slug = "" } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [buttonLabel, setButtonLabel] = useState("Submit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [campaignInfo, setCampaignInfo] = useState<
    {
      campaign_id: string | null;
      owner_id: string;
      form_id: string;
      form_id: string;
      success_message: string | null;
    }
  | null>(null);

  const formIdParam = searchParams.get("form_id");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let formId = formIdParam || undefined;
        let ownerId: string | null = null;
        let campaignId: string | null = null;
        let successMessage: string | null = null;

        // Attempt to resolve as campaign slug
        const { data: camp } = await supabase
          .from("intake_resolver")
          .select(
            "campaign_id, owner_id, status, start_date, end_date, success_message"
          )
          .eq("slug", slug)
          .maybeSingle();

        if (camp) {
          const now = new Date();
          if (
            camp.status !== "active" ||
            (camp.start_date && new Date(camp.start_date) > now) ||
            (camp.end_date && new Date(camp.end_date) < now)
          ) {
            setError("This intake is not currently available.");
            setLoading(false);
            return;
          }
          ownerId = camp.owner_id;
          campaignId = camp.campaign_id;
          successMessage = camp.success_message ?? null;
        } else {
          // Fallback to public slug
          const { data: slugRow, error: slugErr } = await supabase
            .from("public_slugs")
            .select("user_id, default_form_id")
            .eq("slug", slug)
            .maybeSingle();
          if (slugErr || !slugRow) {
            if (import.meta.env.DEV) {
              console.debug("[IntakeRenderer] slug not found", { slug, slugErr });
            }
            setError("Form not found");
            setLoading(false);
            return;
          }
          ownerId = slugRow.user_id;
          if (!formId) formId = slugRow.default_form_id || undefined;
        }

        if (!formId) {
          // Try profile default
          const { data: prof } = await supabase
            .from("profiles")
            .select("default_form_id")
            .eq("id", ownerId!)
            .maybeSingle();
          formId = prof?.default_form_id || undefined;
        }

        if (!formId) {
          setError("Form not found");
          setLoading(false);
          return;
        }

        const { data: fv, error: fvErr } = await supabase
          .from("form_versions")
          .select("id, owner_id, schema_json")
          .eq("form_id", formId)
          .order("version_number", { ascending: false })
          .limit(1)
          .single();
        if (fvErr || !fv) {
          if (import.meta.env.DEV) {
            console.debug("[IntakeRenderer] form version not found", {
              formId,
              fvErr,
            });
          }
          setError("Form not found");
          setLoading(false);
          return;
        }

        ownerId = fv.owner_id;

        setCampaignInfo({
          campaign_id: campaignId,
          owner_id: ownerId!,
          form_id: formId,
          success_message: successMessage,
        });

        const schemaBlocks: Block[] = fv.schema_json?.blocks ?? [];
        let btnText = "Submit";
        const filteredBlocks = schemaBlocks.filter((b) => {
          if (b.type === "button" && btnText === "Submit") {
            btnText = (b as ButtonBlock).text;
            return false;
          }
          return b.type !== "button";
        });
        setButtonLabel(btnText);
        setBlocks(filteredBlocks);
        const initVals: Record<string, any> = {};
        filteredBlocks.forEach((b) => {
          if (
            b.type === "input" ||
            b.type === "choice" ||
            b.type === "dropdown" ||
            b.type === "single-choice"
          )
            initVals[b.name] = "";
          if (b.type === "checkbox") initVals[b.name] = false;
          if (b.type === "multiselect") initVals[b.name] = [];
          if ((b.type === "pdf" || b.type === "link") && b.required)
            initVals[`ack_${b.id}`] = false;
        });
        const prefillField = searchParams.get("gateField");
        const prefillValue = searchParams.get("gateValue");
        if (
          prefillField &&
          prefillValue &&
          Object.prototype.hasOwnProperty.call(initVals, prefillField)
        ) {
          initVals[prefillField] = prefillValue;
        }
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
  }, [slug, formIdParam, searchParams]);

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
      if (b.type === "choice" || b.type === "dropdown" || b.type === "single-choice") {
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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const schema = buildValidation();
        await schema.validate(values, { abortEarly: true });
        let extraValid = true;
        blocks.forEach((b) => {
          if (b.type === "checkbox" && b.required && !values[b.name]) extraValid = false;
          if (
            b.type === "multiselect" &&
            b.required &&
            (!values[b.name] || values[b.name].length === 0)
          )
            extraValid = false;
        });
        if (active) setCanSubmit(extraValid);
      } catch {
        if (active) setCanSubmit(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [values, blocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
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
      const answers: Record<string, any> = {};
      blocks.forEach((b) => {
        let key: string | null = null;
        if ((b as any).mapsToFactory) key = `f.${(b as any).mapsToFactory}`;
        else if ((b as any).fieldName) key = `r.${(b as any).fieldName}`;
        else if ((b as any).dataKey) key = (b as any).dataKey;
        if (!key) return;
        const value = (valid as Record<string, any>)[(b as any).name];
        if (value === undefined || value === null) return;
        if (typeof value === "string" && value.trim() === "") return;
        if (Array.isArray(value) && value.length === 0) return;
        answers[key] = value;
      });
      let consentText: string | null = null;
      blocks.forEach((b) => {
        if (
          (b as any).mapsToFactory === "consent_to_contact" &&
            (valid as Record<string, any>)[(b as any).name]
        ) {
          consentText = (b as any).label ?? null;
        }
      });
      if (!campaignInfo) throw new Error("Form not loaded");
      await submitIntake({
        formId: campaignInfo.form_id,
        campaignId: campaignInfo.campaign_id || undefined,
        userId: campaignInfo.owner_id,
        answers,
        consentText,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-6 rounded shadow text-center">
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return <Success message={campaignInfo?.success_message || undefined} />;
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-6 rounded shadow">
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
              case "dropdown":
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
              case "single-choice":
                return (
                  <div key={block.id}>
                    {block.label && (
                      <label className="block text-sm font-medium mb-1">
                        {block.label}
                        {block.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    )}
                    <div className="space-y-1">
                      {(block.options || []).map((o, i) => (
                        <label key={i} className="flex items-center text-sm gap-2">
                          <input
                            type="radio"
                            name={block.name}
                            value={o}
                            checked={values[block.name] === o}
                            onChange={() => setValues({ ...values, [block.name]: o })}
                          />
                          <span>{o}</span>
                        </label>
                      ))}
                    </div>
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
          <div className="sticky bottom-0 bg-white pt-4">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
