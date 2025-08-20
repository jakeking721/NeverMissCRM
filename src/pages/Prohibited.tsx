import React from "react";
import { Link } from "react-router-dom";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";

export default function Prohibited() {
  const { logout } = useAuth();
  return (
    <PageShell faintFlag>
      <div className="max-w-xl mx-auto text-center pt-20 pb-28 px-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-red-700 mb-4">
            Account Access Prohibited
          </h1>
          <p className="text-gray-600 mb-6">
            Your account has been deactivated. Please contact an administrator if you believe this is a mistake.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={logout}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
            >
              Sign Out
            </button>
            <Link
              to="/"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
