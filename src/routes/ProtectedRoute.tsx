// src/routes/ProtectedRoute.tsx
// -----------------------------------------------------------------------------
// Simplified ProtectedRoute
// - Uses Supabase-backed AuthContext.user
// - Fetches profile role when adminOnly is true
// -----------------------------------------------------------------------------

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/utils/supabaseClient";

type ProtectedProps = {
  children: React.ReactNode;
  adminOnly?: boolean;
};

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedProps) {
  const { user, ready } = useAuth();
  const [isAdminUser, setIsAdminUser] = React.useState(false);

  React.useEffect(() => {
    if (!user || !adminOnly) return;
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setIsAdminUser(data?.role === "admin");
    };
    void check();
  }, [user, adminOnly]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdminUser) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

export function RedirectIfLoggedIn({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
