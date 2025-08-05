import React from "react";
import { useNavigate } from "react-router-dom";

// Local hero background image
const HERO_MEDIA = "/hero-media.jpg";

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative flex items-center justify-center w-full min-h-screen overflow-hidden bg-neutral-50">
      {/* Background media */}
      <img
        src={HERO_MEDIA}
        alt="Small business teamwork"
        className="absolute inset-0 object-cover w-full h-full"
      />
      {/* Neutral overlay for readability */}
      <div className="absolute inset-0 bg-white/80" />
      {/* Subtle patriotic accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-white to-red-500" />
      <div className="relative z-10 flex flex-col items-center max-w-4xl px-6 py-24 text-center">
        <h1 className="mb-6 text-4xl font-extrabold text-patriotBlue sm:text-5xl md:text-6xl">
          <h2>
            <img src="/NeverMissCRM_Logo.png" alt="Logo" className="h-96 w-96" /> A LEAD AGAIN
          </h2>
        </h1>
        <div className="flex items-center mb-8 space-x-4 text-blue-700">
          <span className="hidden h-px bg-blue-700 sm:block sm:w-16" />
          <span className="text-lg font-semibold tracking-wider">Connect</span>
          <span className="w-8 h-px bg-gradient-to-r from-blue-700 to-red-600" />
          <span className="text-lg font-semibold tracking-wider">Grow</span>
          <span className="w-8 h-px bg-gradient-to-r from-red-600 to-blue-700" />
          <span className="text-lg font-semibold tracking-wider">Succeed</span>
          <span className="hidden h-px bg-blue-700 sm:block sm:w-16" />
        </div>
        <button
          className="px-8 py-3 text-lg font-bold text-white transition-colors bg-blue-700 rounded-full shadow-lg sm:text-xl hover:bg-blue-800"
          onClick={() => navigate("/register")}
        >
          Get Started Free
        </button>
      </div>
      {/* Subtle flag overlay in corner */}
      <img
        src="/flag-bg.jpg"
        alt="American flag overlay"
        className="absolute bottom-0 right-0 w-40 opacity-20 pointer-events-none select-none sm:w-56 md:w-64"
      />
    </section>
  );
}
