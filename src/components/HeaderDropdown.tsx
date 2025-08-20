import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { clearLocalPlaceholders } from "@/utils/localCleanup";
import { FaUserCircle } from "react-icons/fa";

export default function HeaderDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    clearLocalPlaceholders();
    await logout();
    navigate("/login");
  };

  return (
    <div className="relative inline-block text-left">
      {/* Icon button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 font-semibold text-blue-800 hover:text-blue-900"
      >
        <FaUserCircle className="text-2xl" />
        <span className="hidden sm:inline">{user.username}</span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg z-50">
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
            onClick={() => {
              setOpen(false);
              navigate("/settings");
            }}
          >
            ⚙️ Settings
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
            onClick={() => {
              setOpen(false);
              navigate("/help");
            }}
          >
            ❓ Help
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
          >
            🔒 Log out
          </button>
        </div>
      )}
    </div>
  );
}
