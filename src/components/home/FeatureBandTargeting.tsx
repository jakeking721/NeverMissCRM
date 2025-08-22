// src/components/FeatureBandTargeting.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function FeatureBandTargeting() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-12 items-center">
        {/* Radar mock (left on md+) */}
        <div className="order-2 md:order-1 relative">
          {/* Subtle background accents */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_30%,rgba(248,113,113,0.25),transparent_60%),radial-gradient(circle_at_10%_80%,rgba(59,130,246,0.25),transparent_55%)] rounded-3xl" />
          {/* Card container */}
          <div className="bg-[#0F182A] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="h-64 rounded-2xl bg-gradient-to-br from-sky-900 to-slate-900 relative overflow-hidden">
              {/* Grid dots */}
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:18px_18px] opacity-60"
              />
              {/* Crosshair (red) */}
              <div aria-hidden className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border-2 border-red-500/80" />
                <div className="absolute h-px w-40 bg-red-500/70" />
                <div className="absolute w-px h-40 bg-red-500/70" />
              </div>
              {/* Radar overlay: slow green sweep + blips */}
              <div aria-hidden className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-t from-green-700/20 to-transparent" />
                {/* sweep (conic-gradient) */}
                <div className="absolute inset-0 [background:conic-gradient(from_0deg,rgba(74,222,128,0.25)_0deg,rgba(74,222,128,0.0)_60deg)] rounded-full animate-[spin_6s_linear_infinite]" />
                {/* blips */}
                <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping" />
                <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-green-400 rounded-full animate-ping" />
                <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-ping" />
              </div>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="order-1 md:order-2 text-white">
          <p className="uppercase tracking-widest text-xs text-red-300 mb-3">TARGETING</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Hit the right audience every time</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Filter customers by ZIP radius, recency, or visit count. Build and save segments you can reuse
            for future campaigns in one click.
          </p>
          <ul className="text-gray-300 text-sm space-y-2 list-disc pl-5 mb-6">
            <li>ZIP radius + city/state</li>
            <li>Recents / number of visits</li>
            <li>Save segments for later sends</li>
          </ul>
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
