// src/pages/Home.tsx
import React from "react";
import HeroSection from "../components/home/HeroSection";
import FeatureBandCampaign from "../components/home/FeatureBandCampaign";
import FeatureBandQR from "../components/home/FeatureBandQR";
import FeatureBandTargeting from "../components/home/FeatureBandTargeting";
import FeatureBandSms from "../components/home/FeatureBandSms";
import CtaStrip from "../components/home/CtaStrip";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-200">
      <HeroSection />
      <FeatureBandCampaign />
      <FeatureBandQR />
      <FeatureBandTargeting />
      <FeatureBandSms />
      <CtaStrip />
      <Footer />
    </div>
  );
}
