import React from "react";
import { useNavigate } from "react-router-dom";

export default function FeatureBandCampaign() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-12 items-center">
        {/* Visual mock (right) */}
        <div className="relative">
          {/* subtle background accents */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.25),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(248,113,113,0.2),transparent_55%)] rounded-3xl" />
          {/* card container */}
          <div className="bg-[#0F182A] border border-white/10 rounded-3xl p-6 shadow-2xl">
            {/* light builder mock */}
            <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-32 bg-gray-100 rounded" />
              <div className="flex justify-end gap-2">
                <div className="w-16 h-8 bg-blue-600 rounded-md" />
                <div className="w-16 h-8 bg-gray-300 rounded-md" />
              </div>
            </div>
          </div>
        </div>
        {/* Text (left) */}
        <div className="text-white">
          <p className="uppercase tracking-widest text-xs text-blue-300 mb-3">Campaign Management</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Build campaigns that convert</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Build and launch campaigns faster with integrated QR codes, customizable forms, and customer
            tracking tools. NeverMissCRM lets you focus on growing relationships while we handle the heavy lifting.
          </p>
          <ul className="text-gray-300 text-sm space-y-2 list-disc pl-5 mb-6">
            <li>Draft messages in minutes</li>
            <li>Schedule blasts and drip flows</li>
            <li>Track performance live</li>
          </ul>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
            onClick={() => navigate("/campaigns")}
          >
            Build a Campaign
          </button>
        </div>
      </div>
    </section>
  );
}
