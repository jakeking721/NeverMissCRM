import React from "react";
import { useNavigate } from "react-router-dom";

export default function FeatureBandTargeting() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-12 items-center">
        <div className="flex justify-center">
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 rounded-full border-2 border-green-400"></div>
            <div className="absolute inset-4 rounded-full border border-green-400/60"></div>
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute w-1/2 h-1/2 origin-bottom-left bg-green-400/40 animate-[spin_4s_linear_infinite]"></div>
            </div>
            <div className="absolute w-2 h-2 bg-green-400 rounded-full top-1/3 left-2/3 animate-ping"></div>
            <div className="absolute w-2 h-2 bg-green-400 rounded-full top-2/3 left-1/3 animate-ping"></div>
          </div>
        </div>
        <div className="text-white">
          <h2 className="mb-4 text-3xl font-bold">Targeting</h2>
          <p className="mb-6 text-gray-300">
            Filter customers by zip code radius, engagement, or custom fields to deliver the right message.
          </p>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
            onClick={() => navigate("/customers")}
          >
            Try Targeting
          </button>
        </div>
      </div>
    </section>
  );
}