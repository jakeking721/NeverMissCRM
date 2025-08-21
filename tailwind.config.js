/** @type {import('tailwindcss').Config} */
let plugins = [];
try {
  plugins = [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ];
} catch (err) {
  console.warn("Optional TailwindCSS plugins are not installed:", err.message);
}

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        patriotBlue: "#0A1F44",
        patriotRed: "#B22234",
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
      },
      fontFamily: {
        sans: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
      },
      opacity: {
        15: "0.15",
      },
    },
  },
  plugins,
};