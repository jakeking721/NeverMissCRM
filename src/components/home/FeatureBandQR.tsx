import React from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getQrBaseUrl } from "@/utils/url";

export default function FeatureBandQR() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-12 items-center">
        {/* Text (left) */}
        <div className="text-white">
          <p className="uppercase tracking-widest text-xs text-blue-300 mb-3">QR Intake</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Launch QR intake in seconds</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Generate a campaign URL and QR instantly. Customers scan and land directly on your selected
            intake form. No apps, no friction — just new contacts in seconds.
          </p>
          <ul className="text-gray-300 text-sm space-y-2 list-disc pl-5 mb-6">
            <li>Unique QR per campaign (tracks attribution)</li>
            <li>Optional center logo on QR with high error correction</li>
            <li>Print‑ready PNG export for stickers and signage</li>
          </ul>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
            onClick={() => navigate("/campaigns")}
          >
            Generate QR Codes
          </button>
        </div>

        {/* Visual mock (right) */}
        <div className="relative">
          {/* subtle background accents */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.25),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(248,113,113,0.2),transparent_55%)] rounded-3xl" />
          {/* card container */}
          <div className="bg-[#0F182A] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex gap-6 items-center">
              {/* QR card */}
              <div className="w-40 h-40 shrink-0 rounded-xl bg-white flex items-center justify-center">
                <QRCodeSVG value={`${getQrBaseUrl()}/intake-demo`} size={120} />
              </div>

              {/* phone mock (light form) */}
              <div className="flex-1">
                <div className="mx-auto w-56 h-[280px] rounded-2xl bg-white shadow-inner border border-gray-200 p-3">
                  {/* form title bar */}
                  <div className="h-6 w-24 bg-gray-200 rounded mb-3" />
                  {/* inputs */}
                  <div className="space-y-2">
                    <div className="h-9 bg-gray-100 rounded" />
                    <div className="h-9 bg-gray-100 rounded" />
                    <div className="h-9 bg-gray-100 rounded" />
                    <div className="h-9 bg-gray-100 rounded" />
                  </div>
                  {/* submit */}
                  <div className="mt-4 h-9 bg-blue-600/90 rounded text-white flex items-center justify-center text-sm font-medium">
                    Submit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
