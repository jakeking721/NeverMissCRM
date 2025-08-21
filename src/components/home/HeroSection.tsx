import React from "react";
import { useNavigate } from "react-router-dom";

const HERO_MEDIA = "/hero-media.jpg";

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative flex items-center justify-center min-h-[600px] md:min-h-screen text-center text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_MEDIA})` }}
      />
      <div className="absolute inset-0 bg-black opacity-15" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-white to-red-500" />
      <div className="relative z-10 flex flex-col items-center px-6 py-32 md:py-48">
        <h1 className="mb-6 text-4xl font-extrabold sm:text-5xl md:text-6xl">
          NEVER MISS A LEAD AGAIN
        </h1>
        <p className="max-w-xl mb-8 text-lg md:text-xl">
          Capture, manage, and engage your audience from anywhere.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
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
