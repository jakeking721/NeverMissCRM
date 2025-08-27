import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import PageShell from "@/components/PageShell";
import { fetchForms } from "@/services/forms";
import { supabase } from "@/utils/supabaseClient";
import {
  createIntakeCampaign,
  getIntakeCampaign,
  updateIntakeCampaign,
} from "@/services/intakeCampaignService";
import { getQrBaseUrl } from "@/utils/url";
import { slugifyCampaign } from "@/utils/strings";

interface FormTemplate {
  id: string;
  form_version_id: string;
  version_label: string;
}

export default function NewIntakeCampaign() {
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [formVersionId, setFormVersionId] = useState<string>("");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [gateField, setGateField] = useState<"phone" | "email">("phone");
  const [prefill, setPrefill] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [requireConsent, setRequireConsent] = useState(false);
  const [status, setStatus] = useState("draft");
  const [slugTaken, setSlugTaken] = useState(false);
  const navigate = useNavigate();
  const [search] = useSearchParams();

  useEffect(() => {
    fetchForms().then(setForms).catch(console.error);
  }, []);

  useEffect(() => {
    const presetVersionId = search.get("id");
    if (presetVersionId) setFormVersionId(presetVersionId);
    const editId = search.get("campaignId");
    if (editId) {
      setCampaignId(editId);
      getIntakeCampaign(editId)
        .then((c) => {
          if (!c) return;
          setTitle(c.title);
          setSlug(c.slug);
          setFormVersionId(c.form_version_id);
          setStart(c.start_date ?? "");
          setEnd(c.end_date ?? "");
          setGateField(c.gate_field);
          setPrefill(c.prefill_gate);
          setSuccessMsg(c.success_message ?? "");
          setRequireConsent(c.require_consent);
          setStatus(c.status);
        })
        .catch(console.error);
    }
  }, [search]);

  const normalizedSlug = slugifyCampaign(slug);
  const url = normalizedSlug ? `${getQrBaseUrl()}/intake/${normalizedSlug}` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (campaignId) {
        await updateIntakeCampaign(campaignId, {
          title,
          slug: normalizedSlug || null,
          form_version_id: formVersionId,
          start_date: start || null,
          end_date: end || null,
          gate_field: gateField,
          prefill_gate: prefill,
          success_message: successMsg || null,
          require_consent: requireConsent,
          status,
        });
      } else {
        await createIntakeCampaign({
          title,
          slug: normalizedSlug || null,
          form_version_id: formVersionId,
          start_date: start || null,
          end_date: end || null,
          gate_field: gateField,
          prefill_gate: prefill,
          success_message: successMsg || null,
          require_consent: requireConsent,
          status,
        });
      }
      navigate("/campaigns/intake");
    } catch (err) {
      console.error(err);
      alert("Failed to save campaign");
    }
  };

  useEffect(() => {
    if (!normalizedSlug) {
      setSlugTaken(false);
      return;
    }
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from("intake_campaigns")
        .select("id")
        .eq("slug", normalizedSlug)
        .eq("owner_id", userId)
        .maybeSingle();
      setSlugTaken(!!data && data.id !== campaignId);
    })();
  }, [normalizedSlug, campaignId]);

  return (
    <PageShell faintFlag>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-semibold">
          {campaignId ? "Edit Intake Campaign" : "New Intake Campaign"}
        </h1>

        <div className="space-y-1">
          <label className="font-medium">Title</label>
          <input
            className="border rounded w-full p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="font-medium">Slug (optional)</label>
          <input
            className="border rounded w-full p-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onBlur={() => setSlug(slugifyCampaign(slug))}
          />
          {slug && slugTaken && (
            <p className="text-sm text-red-600">Slug already in use</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="font-medium">Form Template</label>
          <select
            className="border rounded w-full p-2"
            value={formVersionId}
            onChange={(e) => setFormVersionId(e.target.value)}
            required
          >
            <option value="">Select a form</option>
            {forms.map((f) => (
              <option key={f.form_version_id} value={f.form_version_id}>
                {f.version_label}
              </option>
            ))}
          </select>
          <div className="text-right">
            <a
              href={`/forms/new?returnTo=${encodeURIComponent("/campaigns/intake/new")}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Create new form
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-medium">Start Date</label>
            <input
              type="date"
              className="border rounded w-full p-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium">End Date</label>
            <input
              type="date"
              className="border rounded w-full p-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        {url && (
          <div className="text-center space-y-2">
            <p className="text-sm">Campaign URL: {url}</p>
            <div className="flex justify-center">
              <QRCodeCanvas value={url} size={180} />
            </div>
          </div>
        )}
        <div className="space-y-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={status === "active"}
              onChange={(e) => setStatus(e.target.checked ? "active" : "draft")}
            />
            <span>Active</span>
          </label>
          <div className="space-y-1">
            <label className="font-medium">Gate Field</label>
            <select
              className="border rounded w-full p-2"
              value={gateField}
              onChange={(e) =>
                setGateField(e.target.value as "phone" | "email")
              }
            >
              <option value="phone">Phone</option>
              <option value="email">Email</option>
            </select>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={prefill}
              onChange={(e) => setPrefill(e.target.checked)}
            />
            <span>Prefill form with gate value</span>
          </label>

          <div className="space-y-1">
            <label className="font-medium">Success Message</label>
            <textarea
              className="border rounded w-full p-2"
              value={successMsg}
              onChange={(e) => setSuccessMsg(e.target.value)}
            />
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={requireConsent}
              onChange={(e) => setRequireConsent(e.target.checked)}
            />
            <span>Require consent checkbox</span>
          </label>
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save Campaign
          </button>
        </div>
      </form>
    </PageShell>
  );
}
