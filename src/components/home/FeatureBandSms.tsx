import React from "react";
import { LuMessageSquare } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export default function FeatureBandSms() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0B1220] py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row-reverse items-center gap-12">
        <div className="flex-1 flex justify-center">
          <div className="w-56 h-80 rounded-2xl border-4 border-white p-4 flex flex-col gap-3 bg-gray-900">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl rounded-bl-none w-max">Hi there!</div>
            <div className="bg-gray-700 text-white px-4 py-2 rounded-xl rounded-br-none w-max ml-auto">Can we help you?</div>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl rounded-bl-none w-max">Let's chat!</div>
          </div>
        </div>
        <div className="flex-1 text-white text-center md:text-left">
          <h2 className="mb-4 flex items-center justify-center md:justify-start gap-2 text-3xl md:text-4xl font-bold">
            <LuMessageSquare className="w-8 h-8 text-blue-400" />
            SMS Messaging
          </h2>
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