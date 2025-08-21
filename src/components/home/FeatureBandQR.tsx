import React from "react";
import { useNavigate } from "react-router-dom";

export default function FeatureBandQR() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-last md:order-none flex justify-center">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-white rounded-md"></div>
            <div className="w-24 h-40 rounded-2xl border-4 border-white relative">
              <div className="absolute inset-1 rounded-xl bg-gray-800"></div>
            </div>
          </div>
        </div>
        <div className="text-white">
          <h2 className="mb-4 text-3xl font-bold">QR Intake</h2>
          <p className="mb-6 text-gray-300">
            Generate unique QR codes that lead customers straight to your intake forms.
          </p>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
            onClick={() => navigate("/campaigns")}
          >
            Generate QR Codes
          </button>
        </div>
      </div>
    </section>
  );
}