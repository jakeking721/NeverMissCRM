// src/pages/Home.tsx
import React from "react";
import HeroSection from "../components/home/HeroSection";
import FeatureGrid from "../components/home/FeatureGrid";
import PatriotBanner from "../components/home/PatriotBanner";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <HeroSection />
      <FeatureGrid />
      <PatriotBanner />
    </div>
  );
}
