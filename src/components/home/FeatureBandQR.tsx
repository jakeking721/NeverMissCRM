import React from "react";

export default function FeatureBandQR() {
  return (
    <section className="py-16 bg-blue-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-10 px-6">
        <div className="text-6xl md:text-7xl">í´³</div>
        <div className="flex-1">
          <h2 className="mb-4 text-3xl font-bold text-patriotBlue">QR Intake</h2>
          <p className="mb-4 text-gray-700">
            Generate unique QR codes that lead customers straight to your intake forms.
          </p>
          <ul className="space-y-2 text-gray-700 list-disc list-inside">
            <li>Fast contact collection at events</li>
            <li>Customizable form fields</li>
            <li>Auto-save submissions to your CRM</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
