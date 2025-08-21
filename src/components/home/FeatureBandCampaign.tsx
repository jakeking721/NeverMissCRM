import React from "react";

export default function FeatureBandCampaign() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 px-6">
        <div className="text-6xl md:text-7xl">í³£</div>
        <div className="flex-1">
          <h2 className="mb-4 text-3xl font-bold text-patriotBlue">Campaign Management</h2>
          <p className="mb-4 text-gray-700">
            Craft marketing messages, schedule them, and watch performance in real time.
          </p>
          <ul className="space-y-2 text-gray-700 list-disc list-inside">
            <li>Plan SMS blasts and promotions</li>
            <li>Track open and response rates</li>
            <li>Reuse successful templates</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
