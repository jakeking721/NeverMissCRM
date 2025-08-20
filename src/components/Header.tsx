// src/components/Header.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../utils/auth";
import { isAdmin } from "@/utils/roles";

export default function Header() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const admin = isAdmin(user || undefined);
  const limited =
    !!user && !admin && (!user.is_approved || !user.is_active);

  const handleLogout = () => {
    logoutUser();
    refresh();
    navigate("/");
  };

  return (
    <header className="bg-white border-b shadow-sm z-20 relative">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/NeverMissCRM_Logo.png" alt="Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-blue-700">NeverMiss</span>
          <span className="text-sm text-gray-600">CRM</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex gap-6 text-md font-bold text-gray-700">
          <Link to="/" className="hover:text-blue-600">
            Home
          </Link>
          {!limited && user && (
            <>
              <Link to="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
              <Link to="/customers" className="hover:text-blue-600">
                Customers
              </Link>
              <Link to="/campaigns" className="hover:text-blue-600">
                Campaigns
              </Link>
              <Link to="/settings" className="hover:text-blue-600">
                Settings
              </Link>
            </>
          )}
          <Link to="/help" className="hover:text-blue-600">
            Help
          </Link>
        </nav>

        {/* User actions */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-1 border rounded-full hover:bg-gray-50"
            >
              <span className="material-icons text-gray-600">person</span>
              <span className="text-sm font-medium">{user.username || "User"}</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg py-2 text-sm w-40">
                {!limited && (
                  <Link
                    to="/settings"
                    className="block px-4 py-2 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    Settings
                  </Link>
                )}
                <Link
                  to="/help"
                  className="block px-4 py-2 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  Help
                </Link>
                {admin && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
