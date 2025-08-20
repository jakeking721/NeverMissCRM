// src/App.tsx
// ------------------------------------------------------------------------------------
// Central route registry
// - Public:        /, /login, /register, /help, /u/:username, /intake/:slug
// - Protected:     /dashboard, /customers, /campaigns, /campaigns/new,
//                  /analytics, /settings, /settings/fields, /settings/billing,
//                  /profile, /qrcode
// - Admin-only:    /admin
//
// Header/Footer rendered globally.
// ------------------------------------------------------------------------------------

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Campaigns from "./pages/Campaigns";
import CampaignBuilder from "./pages/CampaignBuilder";
import Analytics from "./pages/Analytics";

import Settings from "./pages/Settings";
import Fields from "./pages/Settings/Fields";
import Billing from "./pages/Settings/Billing";

import Profile from "./pages/Profile";
import QRCodePage from "./pages/QRCode";
import CustomerIntake from "./pages/CustomerIntake";
import IntakeRenderer from "./pages/intake/IntakeRenderer";
import FormList from "./pages/builder/FormList";
import FormBuilder from "./pages/builder/FormBuilder";

import Help from "./pages/Help";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/admin/Users";
import Pending from "./pages/Pending";
import Prohibited from "./pages/Prohibited";
import NotFound from "./pages/NotFound";

import ProtectedRoute, { RedirectIfLoggedIn } from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          {/* -------------------- Public -------------------- */}
          <Route path="/" element={<Home />} />

          <Route element={<RedirectIfLoggedIn />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Public intake (legacy path kept) */}
          <Route path="/u/:username" element={<CustomerIntake />} />

          {/* Dynamic campaign intake */}
          <Route path="/intake/:campaignId/:formSlug" element={<IntakeRenderer />} />

          {/* Public intake (new slug-based path) */}
          <Route path="/intake/:slug" element={<CustomerIntake />} />

          {/* Public help */}
          <Route path="/help" element={<Help />} />

          {/* -------------------- Protected (auth required) -------------------- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/new" element={<CampaignBuilder />} />
            <Route path="/builder" element={<FormList />} />
            <Route path="/builder/:formId" element={<FormBuilder />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/fields" element={<Fields />} />
            <Route path="/settings/billing" element={<Billing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/qrcode" element={<QRCodePage />} />
            <Route path="/pending" element={<Pending />} />
            <Route path="/prohibited" element={<Prohibited />} />
          </Route>

          {/* -------------------- Admin-only -------------------- */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          {/* -------------------- 404 -------------------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <ToastContainer position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
