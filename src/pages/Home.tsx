// src/pages/Home.tsx
import React from "react";
import HeroSection from "../components/home/HeroSection";
import FeatureGrid from "../components/home/FeatureGrid";
import PatriotBanner from "../components/home/PatriotBanner";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-200 relative">
      <HeroSection />
      <FeatureGrid />
      <PatriotBanner />
      {/* FOOTER */}
    </div>
  );
}
