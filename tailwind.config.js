/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderColor: {
        border: 'var(--border)',
      },
      outlineColor: {
        ring: 'var(--ring)',
      },
      fontFamily: {
        lato: ['Lato', 'sans-serif'], // 👈 Add this line
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
  ],
};
