import React from "react";

export default function FeatureGrid() {
  return (
    <section className="px-6 py-20 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* CARD 1 */}
          <div className="flex flex-col items-center max-w-sm p-8 mx-auto border-2 border-blue-100 rounded-2xl shadow-sm">
            <span className="mb-2 text-3xl text-blue-700">📲</span>
            <span className="mb-1 text-lg font-bold text-blue-800">Easy Lead Capture</span>
            <ul className="text-base text-left text-gray-700 list-disc list-inside">
              <li>Customer automated QR entry</li>
              <li>New contacts in seconds</li>
              <li>Zero tech skills needed</li>
              <li>Create custom fields</li>
            </ul>
          </div>
          {/* CARD 2 */}
          <div className="flex flex-col items-center max-w-sm p-8 mx-auto border-2 border-blue-100 rounded-2xl shadow-sm">
            <span className="mb-2 text-3xl text-blue-700">🎯</span>
            <span className="mb-1 text-lg font-bold text-center text-blue-800">
              Always Hit Targeting
              <span className="block text-blue-800">Filters</span>
            </span>
            <ul className="text-base text-left text-gray-700 list-disc list-inside">
              <li>Location (e.g. ZIP code radius)</li>
              <li>Recents or number of visits</li>
              <li>Send updates or promotions</li>
              <li>Create your own!</li>
            </ul>
          </div>
          {/* CARD 3 */}
          <div className="flex flex-col items-center max-w-sm p-8 mx-auto border-2 border-blue-100 rounded-2xl shadow-sm">
            <span className="mb-2 text-3xl text-blue-700">💬</span>
            <span className="mb-1 text-lg font-bold text-blue-800">Text Customers Anytime</span>
            <ul className="text-base text-left text-gray-700 list-disc list-inside">
              <li>Pay-as-you-send</li>
              <li>No hidden fees</li>
              <li>Customize mass SMS campaigns</li>
              <li>Fast, simple, reliable delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}