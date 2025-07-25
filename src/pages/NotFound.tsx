import React from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <PageShell faintFlag>
      <div className="max-w-xl mx-auto text-center pt-20 pb-28 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-10">
          <h1 className="text-5xl font-black text-blue-900 mb-4">404</h1>
          <p className="text-xl text-gray-700 font-semibold mb-2">Page Not Found</p>
          <p className="text-gray-500 mb-6">
            Sorry, the page you’re looking for doesn’t exist or may have moved.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </PageShell>
  );
}
