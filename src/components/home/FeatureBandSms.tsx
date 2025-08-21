import React from "react";
import { useNavigate } from "react-router-dom";

export default function FeatureBandSms() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-last md:order-none flex justify-center">
          <div className="space-y-4 w-full max-w-xs">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl rounded-bl-none w-max">Hi there!</div>
            <div className="bg-gray-700 text-white px-4 py-2 rounded-xl rounded-br-none w-max ml-auto">Can we help you?</div>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl rounded-bl-none w-max">Let's chat!</div>
          </div>
        </div>
        <div className="text-white">
          <h2 className="mb-4 text-3xl font-bold">SMS Messaging</h2>
          <p className="mb-6 text-gray-300">
            Reach customers instantly with personalized texts and track every interaction.
          </p>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
            onClick={() => navigate("/campaigns")}
          >
            Open SMS Tools
          </button>
        </div>
      </div>
    </section>
  );
}