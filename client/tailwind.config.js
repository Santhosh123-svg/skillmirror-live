/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        secondary: "#535bf2",
        darkBg: "#111827",
        lightBg: "#ffffff"
      }
    }
  },
  plugins: []
};
