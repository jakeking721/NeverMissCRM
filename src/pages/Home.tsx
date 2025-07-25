// src/pages/Home.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const PEOPLE_IMG =
  "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&w=900&q=80";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-200 relative">
      {/* Header */}
      {/* HERO SECTION WITH FLAG BACKGROUND */}
      <section className="relative w-full flex flex-col justify-center items-center min-h-[55vh] overflow-hidden">
        {/* Large, soft American flag background */}
        <img
          src="/flag-bg.jpg"
          alt="American Flag"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-20 select-none pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-6xl px-2 py-12 flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 text-center drop-shadow mb-5">
            NEVER MISS A LEAD AGAIN
          </h1>
          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <span className="text-blue-600 text-lg font-semibold tracking-wider">Connect</span>
            <span className="w-10 h-1 rounded bg-gradient-to-r from-blue-400 via-blue-700 to-blue-400"></span>
            <span className="text-blue-600 text-lg font-semibold tracking-wider">Grow</span>
            <span className="w-10 h-1 rounded bg-gradient-to-r from-blue-400 via-blue-700 to-blue-400"></span>
            <span className="text-blue-600 text-lg font-semibold tracking-wider">Succeed</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 w-full justify-center">
            {/* CARD 1 */}
            <div className="bg-white/90 rounded-2xl border-2 border-blue-100 shadow-lg py-5 px-10 flex flex-col items-center max-w-[340px] mx-auto">
              <span className="text-blue-700 text-3xl mb-2">📲</span>
              <span className="font-bold text-blue-800 text-lg mb-1">Easy Lead Capture</span>
              <ul className="list-disc list-inside text-gray-700 text-base text-left">
                <li>Customer automated QR entry</li>
                <li>New contacts in seconds</li>
                <li>Zero tech skills needed</li>
                <li>Create custom fields</li>
              </ul>
            </div>
            {/* CARD 2 */}
            <div className="bg-white/90 rounded-2xl border-2 border-blue-100 shadow-lg py-5 px-10 flex flex-col items-center max-w-[340px] mx-auto">
              <span className="text-blue-700 text-3xl mb-2">🎯</span>
              <span className="font-bold text-blue-800 text-lg mb-1 text-center block">
                Always Hit Targeting
                <span className="block w-full text-blue-800 text-lg text-center">Filters</span>
              </span>
              <ul className="list-disc list-inside text-gray-700 text-base text-left">
                <li>Location (e.g. ZIP code radius)</li>
                <li>Recents or number of visits</li>
                <li>Send updates or promotions</li>
                <li>Create your own!</li>
              </ul>
            </div>
            {/* CARD 3 */}
            <div className="bg-white/90 rounded-2xl border-2 border-blue-100 shadow-lg py-5 px-10 flex flex-col items-center max-w-[340px] mx-auto">
              <span className="text-blue-700 text-3xl mb-2">💬</span>
              <span className="font-bold text-blue-800 text-lg mb-1">Text Customers Anytime</span>
              <ul className="list-disc list-inside text-gray-700 text-base text-left">
                <li>Pay-as-you-send</li>
                <li>No hidden fees</li>
                <li>Customize mass SMS campaigns</li>
                <li>Fast, simple, reliable delivery</li>
              </ul>
            </div>
          </div>
          <button
            className="mt-2 px-10 py-4 text-2xl bg-blue-700 text-white font-bold rounded-full shadow-lg hover:bg-blue-800 transition-all"
            onClick={() => navigate("/register")}
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* ABOUT BAND — USA Stars Pattern */}
      <section
        className="w-full bg-[url('/stars-band.png')] bg-repeat-x bg-blue-50 py-12 px-6 flex flex-col items-center border-y border-blue-100"
        style={{
          backgroundSize: "70px auto",
        }}
      >
        <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-10">
          <img
            src={PEOPLE_IMG}
            alt="Small Business People"
            className="w-full md:w-1/3 h-60 object-cover rounded-3xl shadow-xl border-4 border-blue-300"
          />
          <div className="flex-1">
            <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-extrabold text-blue-900 mb-3 tracking-wide">
              <span role="img" aria-label="USA Flag" className="text-4xl">
                🇺🇸
              </span>
              Built for America’s Small Businesses
            </h2>
            <p className="mb-4 text-blue-800 text-lg font-semibold leading-relaxed">
              From one American entrepreneur to another—NeverMissCRM is made in the USA, built for
              real small business owners who want to stay independent, connected, and competitive.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-400 text-white rounded-full font-bold shadow-sm text-xs tracking-wide uppercase">
                Proudly American Made
              </span>
              <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-400 text-white rounded-full font-bold shadow-sm text-xs tracking-wide uppercase">
                For Local Businesses
              </span>
              <span className="px-4 py-2 bg-white border border-blue-400 text-blue-700 rounded-full font-bold shadow-sm text-xs tracking-wide uppercase">
                No Contracts, No Hassle
              </span>
            </div>
            <ul className="list-disc ml-6 mb-4 text-gray-700 font-medium space-y-1">
              <li>Affordable & honest pricing</li>
              <li>Easy to use on any device—at events, on the go, or in the shop</li>
              <li>Pay-as-you-send—no monthly minimums, no tricks</li>
              <li>Your data stays yours—no “walled gardens”</li>
            </ul>
            <p className="text-gray-700 text-base">
              We’re dedicated to empowering{" "}
              <b>retailers, trades, food trucks, artisans, and homegrown brands</b> across the
              USA—because when local businesses thrive, America does too.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
    </div>
  );
}
