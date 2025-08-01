// src/pages/Campaigns.tsx
// ------------------------------------------------------------------------------------
// Campaigns page (Supabase-ready)
// - Async load from campaignService
// - Delete campaigns
// - Link to /campaigns/new builder
// ------------------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { Link } from "react-router-dom";
import {
  getCampaigns,
  removeCampaign,
  Campaign,
} from "@/services/campaignService";
import { creditsService } from "@/services/creditsService";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [campaignList, balance] = await Promise.all([
          getCampaigns(),
          creditsService.getBalance(),
        ]);
        if (!mounted) return;
        setCampaigns(campaignList);
        setCredits(balance);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      await removeCampaign(id);
      setCampaigns(await getCampaigns());
    } catch (err) {
      console.error(err);
      alert("Failed to delete campaign.");
    }
  };

  return (
    <PageShell faintFlag>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Campaigns</h1>
            <p className="text-sm text-gray-600">
              Create and manage scheduled SMS campaigns. Current credits:{" "}
              <span className="font-semibold">{credits}</span>
            </p>
          </div>
          <Link
            to="/campaigns/new"
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + New Campaign
          </Link>
        </div>

        {/* Campaign List */}
        <section className="p-4 bg-white rounded-md shadow border">
          {loading ? (
            <div className="text-center text-gray-500 py-6">Loading campaigns…</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              No campaigns yet.{" "}
              <Link to="/campaigns/new" className="text-blue-600 hover:underline">
                Create one
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Name</th>
                    <th className="py-2">Recipients</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Created</th>
                    <th className="py-2">Scheduled</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{c.name || "Untitled"}</td>
                      <td className="py-2">{c.recipients?.length ?? 0}</td>
                      <td className="py-2 capitalize">{c.status}</td>
                      <td className="py-2">
                        {new Date(c.createdAt).toLocaleDateString()}{" "}
                        {new Date(c.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2">
                        {c.scheduledFor
                          ? new Date(c.scheduledFor).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => onDelete(c.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Footer Info */}
        <p className="text-xs text-gray-500 text-center">
          Campaigns are currently stored in Supabase (or locally if stubbed).
          Future versions will support drafts, analytics, and Twilio scheduling.
        </p>
      </div>
    </PageShell>
  );
}
