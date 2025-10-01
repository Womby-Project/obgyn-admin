/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderColor: {
        border: "var(--border)", // ✅ custom CSS variable border
      },
      outlineColor: {
        ring: "var(--ring)", // ✅ custom CSS variable ring
      },
      fontFamily: {
        lato: ["Lato", "sans-serif"], // ✅ added Lato
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar-hide"),
    require("@tailwindcss/typography"), // ✅ good for prose formatting
  ],
};
