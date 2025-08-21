import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import PageShell from "@/components/PageShell";
import { IntakeCampaign, getIntakeCampaigns } from "@/services/intakeCampaignService";

export default function IntakeCampaignList() {
  const [campaigns, setCampaigns] = useState<IntakeCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIntakeCampaigns()
      .then(setCampaigns)
      .catch((e) => console.error("Failed to load intake campaigns", e))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/intake/${slug}`;
    navigator.clipboard.writeText(url);
  };

  const downloadQR = (slug: string) => {
    const canvas = document.getElementById(`qr-${slug}`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${slug}.png`;
    link.click();
  };

  return (
    <PageShell faintFlag>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Intake Campaigns</h1>
          <Link
            to="/campaigns/intake/new"
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + New Intake Campaign
          </Link>
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
                      <td className="py-2 text-right space-x-2">
                        <button
                          onClick={() => downloadQR(c.slug)}
                          className="text-blue-600 hover:underline"
                        >
                          QR
                        </button>
                        <button
                          onClick={() => copyLink(c.slug)}
                          className="text-blue-600 hover:underline"
                        >
                          Copy Link
                        </button>
                        <Link
                          to="#"
                          className="text-blue-600 hover:underline"
                        >
                          Submissions
                        </Link>
                        <Link
                          to={`/campaigns/intake/new?id=${c.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                        {/* Hidden canvas for QR download */}
                        <div className="hidden">
                          <QRCodeCanvas id={`qr-${c.slug}`} value={`${window.location.origin}/intake/${c.slug}`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
