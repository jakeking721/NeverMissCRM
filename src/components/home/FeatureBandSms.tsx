import React from "react";

export default function FeatureBandSms() {
  return (
    <section className="py-16 bg-blue-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-10 px-6">
        <div className="text-6xl md:text-7xl">í²¬</div>
        <div className="flex-1">
          <h2 className="mb-4 text-3xl font-bold text-patriotBlue">SMS Messaging</h2>
          <p className="mb-4 text-gray-700">
            Reach customers instantly with personalized texts and track every interaction.
          </p>
          <ul className="space-y-2 text-gray-700 list-disc list-inside">
            <li>Pay-as-you-send pricing</li>
            <li>Template variables and scheduling</li>
            <li>Ready for future email integrations</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
