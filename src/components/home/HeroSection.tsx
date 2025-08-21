import React from "react";
import { useNavigate } from "react-router-dom";

const HERO_MEDIA = "/hero-media.jpg";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative flex items-center justify-center min-h-[600px] md:min-h-screen text-white text-center overflow-hidden">
      <div
        className="absolute inset-0 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_MEDIA})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30" />
      <div className="relative z-10 max-w-2xl px-6 py-32 md:py-48 flex flex-col items-center">
        <h1 className="mb-6 text-4xl font-extrabold sm:text-5xl md:text-6xl">
          NEVER MISS A LEAD AGAIN
        </h1>
        <p className="max-w-xl mb-8 text-lg md:text-xl">
          Capture, manage, and engage your audience from anywhere.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            className="px-8 py-3 text-lg font-bold text-white bg-blue-700 rounded-full shadow hover:bg-blue-800"
            onClick={() => navigate("/register")}
          >
            Get Started Free
          </button>
          <button
            className="px-8 py-3 text-lg font-bold text-blue-700 bg-white rounded-full shadow hover:bg-gray-100"
            onClick={() => navigate("/demo")}
          >
            Book a Demo
          </button>
        </div>
      </div>
    </section>
  );
}
