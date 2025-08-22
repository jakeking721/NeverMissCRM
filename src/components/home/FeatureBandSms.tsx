import React from "react";
import { useNavigate } from "react-router-dom";

export default function FeatureBandSms() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-12 items-center">
        {/* Text (left) */}
        <div className="text-white">
          <p className="uppercase tracking-widest text-xs text-blue-300 mb-3">SMS</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Send texts with confidence</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Pay-as-you-send with no hidden fees. Draft, schedule, and track replies — all inside NeverMissCRM.
          </p>
          <ul className="text-gray-300 text-sm space-y-2 list-disc pl-5 mb-6">
            <li>Scheduling + credit tracking</li>
            <li>Two-way reply capture</li>
            <li>Fast, reliable delivery</li>
          </ul>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
            onClick={() => navigate("/campaigns")}
          >
            Open SMS Tools
          </button>
        </div>

        {/* Chat mock (right) */}
        <div className="relative">
          {/* subtle background accents */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.25),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.2),transparent_55%)] rounded-3xl" />
          {/* card container */}
          <div className="bg-[#0F182A] border border-white/10 rounded-3xl p-6 shadow-2xl">
            {/* light chat area */}
            <div className="h-64 rounded-2xl bg-slate-50 p-4 flex flex-col gap-3">
              <div className="self-start bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-2 max-w-[75%] text-sm">
                Sportsman's Outdoor trade show this weekend! Reply Y to confirm your attendance.
              </div>
              <div className="self-end bg-blue-600 text-white rounded-2xl px-4 py-2 max-w-[75%] text-sm">
                Y
              </div>
              <div className="self-start bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-2 max-w-[75%] text-sm">
                You’re in! Watch for exclusive offers and updates.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
