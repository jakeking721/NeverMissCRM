// src/pages/Register.tsx
// -----------------------------------------------------------------------------
// Supabase-native registration page
// - Calls supabase.auth.signUp directly
// - Sends username in user_meta so the DB trigger can read it
// - Shows a friendly message when email confirmation is required
// -----------------------------------------------------------------------------

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabaseClient"; // Fixed import path
import { useAuth } from "../context/AuthContext";
import { refreshCurrentUser } from "../utils/auth";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { refresh } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }, // user metadata
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Registration failed.");
      return;
    }

    // If "Confirm email" is enabled, show message instead of redirect
    if (data?.user && !data.session) {
      setInfo(
        "Check your email to confirm your account. You can sign in after confirming."
      );
      return;
    }

    // If email confirmations are disabled, user is logged in right away
    await refreshCurrentUser();
    refresh();
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* faint flag bg */}
      <div
        className="fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background: "url('/flag-bg.jpg') center center / cover no-repeat",
          opacity: 0.12,
          pointerEvents: "none",
        }}
      />

      <div className="flex-grow flex items-center justify-center relative z-10">
        <form
          className="bg-white/90 backdrop-blur rounded-2xl shadow-xl px-8 py-8 w-full max-w-sm"
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-extrabold text-center mb-6 text-blue-800">
            Create Account
          </h2>

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 mb-4"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 mb-6"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
          )}

          {info && (
            <div className="mb-4 text-green-600 text-sm text-center">{info}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition disabled:opacity-60"
          >
            {loading ? "Registering…" : "Register"}
          </button>

          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-700 hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
