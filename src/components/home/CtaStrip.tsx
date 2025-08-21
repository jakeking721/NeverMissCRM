import React from "react";
import { LuArrowRight } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export default function CtaStrip() {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20 text-center text-white">
      <h2 className="mb-8 text-3xl md:text-4xl font-bold">Ready to Grow Your Customer Base?</h2>
      <button
        className="px-8 py-3 font-semibold bg-white text-blue-700 rounded-full shadow hover:bg-gray-100 inline-flex items-center gap-2"
        onClick={() => navigate("/register")}
      >
        Start Free Today
        <LuArrowRight className="w-5 h-5" />
      </button>
    </section>
  );
}
