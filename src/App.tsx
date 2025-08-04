// src/App.tsx
// ------------------------------------------------------------------------------------
// Central route registry
// - Public:        /, /login, /register, /help, /adminlogin, /u/:username, /intake/:slug
// - Protected:     /dashboard, /customers, /campaigns, /campaigns/new,
//                  /analytics, /settings, /settings/fields, /settings/billing,
//                  /profile, /qrcode
// - Admin-only:    /admin
//
// Header/Footer rendered globally.
// ------------------------------------------------------------------------------------

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
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
import NotFound from "./pages/NotFound";

import ProtectedRoute, { RedirectIfLoggedIn } from "./routes/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          {/* -------------------- Public -------------------- */}
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={
              <RedirectIfLoggedIn>
                <Login />
              </RedirectIfLoggedIn>
            }
          />

          <Route
            path="/register"
            element={
              <RedirectIfLoggedIn>
                <Register />
              </RedirectIfLoggedIn>
            }
          />

          {/* Public intake (legacy path kept) */}
          <Route path="/u/:username" element={<CustomerIntake />} />

          {/* Dynamic campaign intake */}
          <Route path="/intake/:campaignId/:formSlug" element={<IntakeRenderer />} />

          {/* Public intake (new slug-based path) */}
          <Route path="/intake/:slug" element={<CustomerIntake />} />

          {/* Public help */}
          <Route path="/help" element={<Help />} />

          {/* Public admin login */}
          <Route
            path="/adminlogin"
            element={
              <RedirectIfLoggedIn>
                <AdminLogin />
              </RedirectIfLoggedIn>
            }
          />

          {/* -------------------- Protected (auth required) -------------------- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
          />

          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <Campaigns />
              </ProtectedRoute>
            }
          />

            <Route
              path="/campaigns/new"
              element={
                <ProtectedRoute>
                  <CampaignBuilder />
                </ProtectedRoute>
              }
            />

            <Route
              path="/builder"
              element={
                <ProtectedRoute>
                  <FormList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/builder/:formId"
              element={
                <ProtectedRoute>
                  <FormBuilder />
                </ProtectedRoute>
              }
            />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Settings root */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/fields"
            element={
              <ProtectedRoute>
                <Fields />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />

          {/* User profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* QR code page */}
          <Route
            path="/qrcode"
            element={
              <ProtectedRoute>
                <QRCodePage />
              </ProtectedRoute>
            }
          />

          {/* -------------------- Admin-only -------------------- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* -------------------- 404 -------------------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}
