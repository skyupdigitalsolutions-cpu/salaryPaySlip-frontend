/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
    "./assets/**/*.css",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#1a3a2a",
          light: "#2d6a4f",
          50: "#f0f7f3",
        },
        accent: {
          DEFAULT: "#c9a84c",
          light: "#f0d080",
          50: "#fff8e6",
        },
      },
    },
  },
  plugins: [],
};
