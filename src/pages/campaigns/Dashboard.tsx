import React from "react";
import { Link } from "react-router-dom";
import PageShell from "@/components/PageShell";

export default function CampaignDashboard() {
  return (
    <PageShell faintFlag>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/campaigns/intake"
            className="border rounded-lg p-6 bg-white shadow hover:bg-gray-50 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-medium mb-2">Intake Campaigns</h2>
              <p className="text-sm text-gray-600">
                Collect leads via custom forms and QR codes.
              </p>
            </div>
            <span className="mt-4 text-blue-600 font-semibold">Manage</span>
          </Link>

          <div className="border rounded-lg p-6 bg-gray-50 shadow flex flex-col justify-between opacity-70">
            <div>
              <h2 className="text-lg font-medium mb-2">SMS Campaigns</h2>
              <p className="text-sm text-gray-600">Coming soon.</p>
            </div>
            <span className="mt-4 text-gray-400 font-semibold">Scheduled Messaging</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
