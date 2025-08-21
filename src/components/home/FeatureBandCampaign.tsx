import React from "react";
import { useNavigate } from "react-router-dom";

export default function FeatureBandCampaign() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-12 items-center">
        <div className="flex justify-center">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
            <div className="flex justify-end gap-2">
              <div className="w-12 h-3 bg-blue-600 rounded"></div>
              <div className="w-12 h-3 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
        <div className="text-white">
          <h2 className="mb-4 text-3xl font-bold">Campaign Management</h2>
          <p className="mb-6 text-gray-300">
            Craft marketing messages, schedule them, and watch performance in real time.
          </p>
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