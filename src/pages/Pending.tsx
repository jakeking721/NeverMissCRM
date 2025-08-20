import React from "react";
import { Link } from "react-router-dom";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";

export default function Pending() {
  const { logout } = useAuth();
  return (
    <PageShell faintFlag>
      <div className="max-w-xl mx-auto text-center pt-20 pb-28 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Account Pending Approval
          </h1>
          <p className="text-gray-600 mb-6">
            Your account is awaiting approval. You will be notified once an administrator activates your access.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              Back to Home
            </Link>
            <button
              onClick={logout}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
