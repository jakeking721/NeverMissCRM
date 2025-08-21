import React from "react";

export default function FeatureBandTargeting() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 px-6">
        <div className="text-6xl md:text-7xl">í¾¯</div>
        <div className="flex-1">
          <h2 className="mb-4 text-3xl font-bold text-patriotBlue">Targeting</h2>
          <p className="mb-4 text-gray-700">
            Filter customers by zip code radius, engagement, or custom fields to deliver the right message.
          </p>
          <ul className="space-y-2 text-gray-700 list-disc list-inside">
            <li>Zip code radius searches</li>
            <li>Segment by behavior or tags</li>
            <li>Save favorite filters</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
