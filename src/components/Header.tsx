import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { clearLocalPlaceholders } from "@/utils/localCleanup";
import { isAdmin } from "@/utils/roles";
import { ChevronDown } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const admin = isAdmin(user || undefined);
  const limited = !!user && !admin && (!user.is_approved || !user.is_active);

  const handleLogout = async () => {
    clearLocalPlaceholders();
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/NeverMissCRM_Logo.png" alt="Logo" className="h-9 w-9" />
          <span className="text-xl font-extrabold tracking-tight text-blue-700">NeverMiss</span>
          <span className="text-sm font-semibold text-gray-500">CRM</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex gap-8 text-base font-semibold text-gray-800">
          <Link to="/" className="transition-colors hover:text-blue-600">
            Home
          </Link>
          {!limited && user && (
            <>
              <Link to="/dashboard" className="transition-colors hover:text-blue-600">
                Dashboard
              </Link>
              <Link to="/customers" className="transition-colors hover:text-blue-600">
                Customers
              </Link>
              <Link to="/campaigns" className="transition-colors hover:text-blue-600">
                Campaigns
              </Link>
              <Link to="/settings" className="transition-colors hover:text-blue-600">
                Settings
              </Link>
            </>
          )}
        </nav>

        {/* User actions or Login/Help */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <span className="material-icons text-gray-600">person</span>
              <span>{user.username || "User"}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                {!limited && (
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    Settings
                  </Link>
                )}
                <Link
                  to="/help"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  Help
                </Link>
                {admin && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/help"
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Help
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
