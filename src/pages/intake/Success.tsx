// src/pages/intake/Success.tsx
// -----------------------------------------------------------------------------
// Simple success screen displayed after an intake form submission
// -----------------------------------------------------------------------------

import React from "react";
import { FaCheckCircle } from "react-icons/fa";

export default function Success({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded shadow text-center space-y-4">
        <FaCheckCircle className="text-green-600 text-5xl mx-auto" />
        <h1 className="text-xl font-semibold">Customer Added</h1>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </div>
    </div>
  );
}
