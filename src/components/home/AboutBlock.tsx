import React from "react";

export default function AboutBlock() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-6 text-center">
                <h2 className="mb-6 text-3xl font-bold text-patriotBlue">About NeverMiss CRM</h2>
                <p className="mb-10 text-gray-700">
                    Our mission copy goes here. Customize this section to tell your story and values.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <span className="px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
                        Proudly American Made
                    </span>
                    <span className="px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
                        Veteran Owned
                    </span>
                    <span className="px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
                        Community Focused
                    </span>
                </div>
            </div>
        </section>
    );
}