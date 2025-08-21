import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import PageShell from "@/components/PageShell";
import { fetchForms } from "@/services/forms";
import { createIntakeCampaign } from "@/services/intakeCampaignService";

interface FormTemplate {
  id: string;
  slug: string;
}

export default function NewIntakeCampaign() {
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [formId, setFormId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const navigate = useNavigate();
  const [search] = useSearchParams();

  useEffect(() => {
    fetchForms().then(setForms).catch(console.error);
  }, []);

  useEffect(() => {
    const existingId = search.get("id");
    if (existingId) setFormId(existingId);
  }, [search]);

  const url = slug ? `${window.location.origin}/intake/${slug}` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createIntakeCampaign({
        title,
        slug,
        form_id: formId,
        start_date: start || null,
        end_date: end || null,
      });
      navigate("/campaigns/intake");
    } catch (err) {
      console.error(err);
      alert("Failed to create campaign");
    }
  };

  return (
    <PageShell faintFlag>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-semibold">New Intake Campaign</h1>

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
          <label className="font-medium">Slug</label>
          <input
            className="border rounded w-full p-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="font-medium">Form Template</label>
          <select
            className="border rounded w-full p-2"
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
            required
          >
            <option value="">Select a form</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.slug || f.id}
              </option>
            ))}
          </select>
          <div className="text-right">
            <a
              href="/forms/new"
              className="text-sm text-blue-600 hover:underline"
              target="_blank"
              rel="noreferrer"
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

        <div className="text-right">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Campaign
          </button>
        </div>
      </form>
    </PageShell>
  );
}
