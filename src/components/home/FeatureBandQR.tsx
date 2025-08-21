import React from "react";
import { LuQrCode } from "react-icons/lu";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";

export default function FeatureBandQR() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row-reverse items-center gap-12">
        <div className="flex-1 flex justify-center">
          <div className="w-40 h-40 bg-white rounded-md p-2 flex items-center justify-center">
            <QRCodeSVG value="https://example.com/intake-demo" size={120} />
          </div>
        </div>
        <div className="flex-1 text-white text-center md:text-left">
          <h2 className="mb-4 flex items-center justify-center md:justify-start gap-2 text-3xl md:text-4xl font-bold">
            <LuQrCode className="w-8 h-8 text-blue-400" />
            Launch QR intake in seconds
          </h2>
          <ul className="mb-6 text-gray-300 list-disc list-inside space-y-2">
            <li>Create unique codes instantly</li>
            <li>Link customers to custom forms</li>
            <li>Track every scan in real time</li>
          </ul>
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