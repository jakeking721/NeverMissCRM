import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import PageShell from "@/components/PageShell";
import ActionsDropdown from "@/components/ActionsDropdown";
import QrModal from "@/components/QrModal";
import {
  IntakeCampaign,
  getIntakeCampaigns,
  removeIntakeCampaign,
} from "@/services/intakeCampaignService";
import { getQrBaseUrl } from "@/utils/url";

export default function IntakeCampaignList() {
  const [campaigns, setCampaigns] = useState<IntakeCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrSlug, setQrSlug] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getIntakeCampaigns()
      .then(setCampaigns)
      .catch((e) => console.error("Failed to load intake campaigns", e))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = (slug: string | null) => {
    if (!slug) return;
    const url = `${getQrBaseUrl()}/intake/${slug}`;
    navigator.clipboard.writeText(url);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    try {
      await removeIntakeCampaign(id);
      setCampaigns(await getIntakeCampaigns());
    } catch (e) {
      console.error("Failed to delete intake campaign", e);
    }
  };

  return (
    <PageShell faintFlag>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Intake Campaigns</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Link
              to="/forms"
              aria-label="Manage intake forms"
              className="flex items-center justify-center gap-1 rounded border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FileText className="h-4 w-4" />
              <span>Manage Forms</span>
            </Link>
            <Link
              to="/campaigns/intake/new"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + New Intake Campaign
            </Link>
          </div>
        </div>

        <section className="bg-white shadow rounded p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-6">Loading…</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center text-gray-500 py-6 space-y-4">
              <p>No intake campaigns yet.</p>
              <Link to="/campaigns/intake/new" className="text-blue-600 underline">
                Create your first campaign
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Title</th>
                    <th className="py-2">Start</th>
                    <th className="py-2">End</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{c.title}</td>
                      <td className="py-2">{c.start_date ? new Date(c.start_date).toLocaleDateString() : "—"}</td>
                      <td className="py-2">{c.end_date ? new Date(c.end_date).toLocaleDateString() : "—"}</td>
                      <td className="py-2 capitalize">{c.status}</td>
                      <td className="py-2 text-right">
                        <ActionsDropdown
                          items={[
                            ...(c.slug
                              ? [
                                  { label: "QR Code", onClick: () => setQrSlug(c.slug) },
                                  { label: "Copy Link", onClick: () => copyLink(c.slug) },
                                ]
                              : []),
                            {
                              label: "Submissions",
                              onClick: () => navigate(`/campaigns/intake/${c.id}/submissions`),
                            },
                            {
                              label: "Edit",
                              onClick: () => navigate(`/campaigns/intake/new?campaignId=${c.id}`),
                            },
                            { label: "Delete", onClick: () => onDelete(c.id) },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <QrModal
        isOpen={!!qrSlug}
        url={qrSlug ? `${getQrBaseUrl()}/intake/${qrSlug}` : ""}
        onClose={() => setQrSlug(null)}
      />
    </PageShell>
  );
}
