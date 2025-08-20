// src/routes/ProtectedRoute.tsx
// -----------------------------------------------------------------------------
// Auth-aware route guard
// - Redirects to /login when not authenticated
// - Non-admins: /pending if not approved, /prohibited if deactivated
// -----------------------------------------------------------------------------

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "@/components/Loader";

export default function ProtectedRoute() {
  const { user, session, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <Loader />;
  if (!session || !user) return <Navigate to="/login" replace />;

  const isAdmin = user.role === "admin";
  if (!isAdmin && !user.is_approved && location.pathname !== "/pending") {
    return <Navigate to="/pending" replace />;
  }
  if (!isAdmin && !user.is_active && location.pathname !== "/prohibited") {
    return <Navigate to="/prohibited" replace />;
  }

  return <Outlet />;
}

export function RedirectIfLoggedIn() {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
