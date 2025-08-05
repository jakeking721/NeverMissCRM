// src/routes/ProtectedRoute.tsx
// -----------------------------------------------------------------------------
// Backwards-compatible ProtectedRoute
// - Prefers Supabase-backed AuthContext.user
// - Still falls back to getCurrentUser() so legacy pages keep working
// - Keeps adminOnly support via utils/roles.isAdmin
// -----------------------------------------------------------------------------

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser } from "../utils/auth";
import { isAdmin } from "../utils/roles";

type ProtectedProps = {
  children: React.ReactNode;
  adminOnly?: boolean;
};

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedProps) {
  const { user } = useAuth();
  const effectiveUser = user ?? getCurrentUser(); // TEMP fallback

  if (!effectiveUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin(effectiveUser)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function RedirectIfLoggedIn({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const effectiveUser = user ?? getCurrentUser(); // TEMP fallback
  if (effectiveUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
