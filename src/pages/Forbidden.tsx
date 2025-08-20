import React from "react";
import { Link } from "react-router-dom";
import PageShell from "@/components/PageShell";

export default function Forbidden() {
  return (
    <PageShell faintFlag>
      <div className="max-w-xl mx-auto text-center pt-20 pb-28 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-10">
          <h1 className="text-5xl font-black text-blue-900 mb-4">403</h1>
          <p className="text-xl text-gray-700 font-semibold mb-2">
            You don’t have permission to view this page.
          </p>
          <p className="text-gray-500 mb-6">Contact your administrator for access.</p>
          <Link
            to="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
