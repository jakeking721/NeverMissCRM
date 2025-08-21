import React from "react";
import { LuMegaphone } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export default function FeatureBandCampaign() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-32 bg-gray-100 rounded" />
            <div className="flex justify-end gap-2">
              <div className="w-12 h-3 bg-blue-600 rounded" />
              <div className="w-12 h-3 bg-gray-300 rounded" />
            </div>
          </div>
        </div>
        <div className="flex-1 text-white text-center md:text-left">
          <h2 className="mb-4 flex items-center justify-center md:justify-start gap-2 text-3xl md:text-4xl font-bold">
            <LuMegaphone className="w-8 h-8 text-blue-400" />
            Campaign Management
          </h2>
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