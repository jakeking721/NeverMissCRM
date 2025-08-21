// src/components/Footer.tsx

import React from "react";

const Footer: React.FC = () => (
  <footer className="w-full mt-12 border-t border-white/10 bg-[#0B1220] text-gray-300">
    <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs flex flex-col sm:flex-row items-center justify-center gap-2">
      <span>
        &copy; {new Date().getFullYear()} NeverMiss CRM. All rights reserved.
      </span>
      <span>Made in America 🇺🇸</span>
    </div>
  </footer>
);

export default Footer;