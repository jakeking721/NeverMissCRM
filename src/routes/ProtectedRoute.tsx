// src/routes/ProtectedRoute.tsx
// -----------------------------------------------------------------------------
// Simplified ProtectedRoute
// - Uses Supabase-backed AuthContext.user
// - Fetches profile role when adminOnly is true
// -----------------------------------------------------------------------------

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/utils/supabaseClient";
import Loader from "@/components/Loader";

type ProtectedProps = {
  adminOnly?: boolean;
};
export default function ProtectedRoute({ adminOnly = false }: ProtectedProps) {
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

  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdminUser) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export function RedirectIfLoggedIn() {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
