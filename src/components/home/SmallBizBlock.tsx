import React from "react";

export default function SmallBizBlock() {
  return (
    <section className="bg-[#0A0F1A] text-gray-400 py-12">
      <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
        <h3 className="text-lg font-semibold text-white">Built for America’s Small Businesses</h3>
        <p className="text-sm text-gray-400">
          From one entrepreneur to another — NeverMissCRM is proudly built in the USA for small
          businesses who want to stay independent, connected, and competitive.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Proudly American Made
          </span>
          <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            For Local Businesses
          </span>
          <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            No Contracts, No Hassle
          </span>
        </div>
      </div>
    </section>
  );
}