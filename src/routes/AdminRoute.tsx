import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/utils/roles";
import Forbidden from "@/pages/Forbidden";
import Loader from "@/components/Loader";

export default function AdminRoute() {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin(user)) return <Forbidden />;
  return <Outlet />;
}
