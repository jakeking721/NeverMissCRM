import React from "react";

export default function SmallBizBlock() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="mb-6 text-3xl md:text-4xl font-bold text-patriotBlue">
          Built for America’s Small Businesses
        </h2>
        <p className="mb-10 text-gray-700">
          From one entrepreneur to another, NeverMiss CRM was created to help
          local businesses capture more leads and keep customers coming back.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <span className="px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
            Proudly American Made
          </span>
          <span className="px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
            For Local Businesses
          </span>
          <span className="px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
            No Contracts, No Risk
          </span>
        </div>
      </div>
    </section>
  );
}