// src/components/Footer.tsx

import React from "react";

const Footer: React.FC = () => (
  <footer
    className="w-full bg-white bg-opacity-80 border-t shadow-inner mt-12"
    style={{
      background: `url(/flag-bg.jpg) center right / contain no-repeat, rgba(255,255,255,0.85)`,
    }}
  >
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500 font-medium">
      <span>
        &copy; {new Date().getFullYear()}{" "}
        <span className="font-bold text-blue-700">NeverMiss CRM</span>. All rights reserved.
      </span>
      <span>Made in America 🇺🇸 {/* You can remove or personalize this line! */}</span>
    </div>
  </footer>
);

export default Footer;
