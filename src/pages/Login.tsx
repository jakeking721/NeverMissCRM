// src/pages/Login.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser, refreshCurrentUser } from "../utils/auth"; // TEMP fallback until we fully remove it
import { supabase } from "@/utils/supabaseClient";

export default function Login() {
  const [id, setId] = useState(""); // username or email (we'll just pass to supabase as email)
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { refresh, user } = useAuth();

  // If already logged in, bounce away
  useEffect(() => {
    const me = user ?? getCurrentUser(); // TEMP: legacy fallback
    if (me) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // For now, treat "id" as email (Supabase doesn't let us look up username without a session).
    const { error } = await supabase.auth.signInWithPassword({
      email: id,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Invalid credentials.");
      return;
    }

    // Ensure the auth cache is updated before navigating
    await refreshCurrentUser();
    refresh();
    navigate("/dashboard", { replace: true });
  };

  return (
    <PageShell faintFlag>
      <div className="flex-grow flex items-center justify-center relative z-10">
        <form
          className="bg-white/90 backdrop-blur rounded-2xl shadow-xl px-8 py-8 w-full max-w-sm"
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-extrabold text-center mb-6 text-blue-800">
            Log in
          </h2>

          {error && (
            <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none"
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log In"}
          </button>

          <p className="mt-4 text-sm text-center">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-700 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}
