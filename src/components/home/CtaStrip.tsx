import React from "react";
import { useNavigate } from "react-router-dom";

export default function CtaStrip() {
  const navigate = useNavigate();
  return (
    <section className="py-12 text-center text-white bg-patriotBlue">
      <h2 className="mb-4 text-2xl font-bold">Ready to grow your business?</h2>
      <button
        className="px-8 py-3 font-semibold text-patriotBlue bg-white rounded-full shadow hover:bg-gray-100"
        onClick={() => navigate("/register")}
      >
        Get Started Free
      </button>
    </section>
  );
}
