import React from "react";

const PEOPLE_IMG =
  "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&w=900&q=80";

export default function PatriotBanner() {
  return (
    <section
      className="px-6 py-12 border-t border-b border-blue-100 bg-blue-50 bg-[url('/stars-band.png')] bg-repeat-x"
      style={{ backgroundSize: "70px auto" }}
    >
      <div className="flex flex-col items-center w-full max-w-5xl gap-10 mx-auto md:flex-row">
        <img
          src={PEOPLE_IMG}
          alt="Small Business People"
          className="object-cover w-full h-60 border-4 border-blue-300 rounded-3xl shadow-xl md:w-1/3"
        />
        <div className="flex-1">
          <h2 className="flex items-center gap-3 mb-3 text-2xl font-extrabold tracking-wide text-blue-900 md:text-3xl">
            <span role="img" aria-label="USA Flag" className="text-4xl">
              🇺🇸
            </span>
            Built for America’s Small Businesses
          </h2>
          <p className="mb-4 text-lg font-semibold leading-relaxed text-blue-800">
            From one American entrepreneur to another—NeverMissCRM is made in the USA, built for
            real small business owners who want to stay independent, connected, and competitive.
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="px-4 py-2 text-xs font-bold tracking-wide text-white uppercase rounded-full shadow-sm bg-gradient-to-r from-blue-700 to-blue-400">
              Proudly American Made
            </span>
            <span className="px-4 py-2 text-xs font-bold tracking-wide text-white uppercase rounded-full shadow-sm bg-gradient-to-r from-red-500 to-red-400">
              For Local Businesses
            </span>
            <span className="px-4 py-2 text-xs font-bold tracking-wide text-blue-700 uppercase bg-white border border-blue-400 rounded-full shadow-sm">
              No Contracts, No Hassle
            </span>
          </div>
          <ul className="mb-4 space-y-1 font-medium text-gray-700 list-disc ml-6">
            <li>Affordable & honest pricing</li>
            <li>Easy to use on any device—at events, on the go, or in the shop</li>
            <li>Pay-as-you-send—no monthly minimums, no tricks</li>
            <li>Your data stays yours—no “walled gardens”</li>
          </ul>
          <p className="text-base text-gray-700">
            We’re dedicated to empowering{" "}
            <b>retailers, trades, food trucks, artisans, and homegrown brands</b> across the
            USA—because when local businesses thrive, America does too.
          </p>
        </div>
      </div>
    </section>
  );
}
