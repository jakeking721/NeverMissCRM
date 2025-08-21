// src/components/Footer.tsx

import React from "react";

const Footer: React.FC = () => (
  <footer
    className="w-full mt-12 border-t bg-white/90 backdrop-blur"
    style={{
      background: `url(/flag-bg.jpg) center right / contain no-repeat, rgba(255,255,255,0.85)`,
    }}
  >
    <div className="max-w-6xl mx-auto px-4 py-10 text-center sm:text-left">
      <h2 className="text-lg font-semibold text-gray-800">NeverMiss CRM</h2>
      <p className="mt-2 text-sm text-gray-600">
        Manage customers, campaigns, and outreach wherever you are.
      </p>
      <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
        <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
          Mobile Ready
        </span>
        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          QR Forms
        </span>
        <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
          SMS Campaigns
        </span>
      </div>
    </div>
    <div className="max-w-6xl mx-auto px-4 py-4 border-t text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
      <span>
        &copy; {new Date().getFullYear()} <span className="font-bold text-blue-700">NeverMiss CRM</span>. All rights reserved.
      </span>
      <span>Made in America 🇺🇸</span>
    </div>
  </footer>
);

export default Footer;