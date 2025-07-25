// src/pages/BulkImport.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
// TODO: Implement CSV upload and import logic here

export default function BulkImport() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen w-full bg-blue-50 relative overflow-x-hidden"
      style={{
        background: `url('/flag-bg.jpg') center top / cover no-repeat, linear-gradient(to bottom right, #e0e8f8 50%, #f8fafc 100%)`,
      }}
    >
      {/* TODO: Insert <Header /> here */}
      <div className="max-w-2xl mx-auto pt-12 px-4 pb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-6">
          Bulk Import Contacts
        </h1>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* TODO: Add CSV upload component and import instructions */}
          <div className="text-gray-400 text-center py-10">
            Bulk import from CSV (Excel/Google Sheets) coming soon!
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      {/* TODO: Insert <Footer /> here */}
    </div>
  );
}
