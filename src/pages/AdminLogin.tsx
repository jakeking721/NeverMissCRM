// src/pages/AdminLogin.tsx
import React, { useState } from "react";
import { loginUser, getCurrentUser } from "../utils/auth";
import { useNavigate } from "react-router-dom";
export default function AdminLogin() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // loginUser now expects an object with usernameOrEmail and password
    const result = loginUser({ usernameOrEmail: id, password });

    if (!result.ok) {
      setError(result.message || "Invalid login.");
      return;
    }

    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      setError("You are not an admin.");
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Flag background */}
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
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl px-8 py-8 w-full max-w-sm mt-10">
          <h2 className="text-2xl font-extrabold text-center mb-6 text-blue-800">Admin Login</h2>
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Username or Email
            </label>
            <input
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 mb-4"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              autoFocus
            />
            <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
            <input
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 mb-4"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="mb-4 text-red-600 text-sm text-center">{error}</div>}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition"
            >
              Log In as Admin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
