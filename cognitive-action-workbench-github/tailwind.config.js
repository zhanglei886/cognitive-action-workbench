/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f8f8f7",
          100: "#eeeeeb",
          200: "#deddd8",
          700: "#3d403b",
          900: "#181a17",
        },
        moss: {
          100: "#e8efe2",
          300: "#b8c9aa",
          500: "#748965",
          700: "#4b5f40",
        },
        clay: {
          100: "#f0e7df",
          400: "#b7896b",
          600: "#7e563e",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        quiet: "0 18px 55px rgba(24, 26, 23, 0.08)",
        panel: "0 24px 80px rgba(24, 26, 23, 0.10)",
        soft: "0 10px 30px rgba(24, 26, 23, 0.06)",
      },
    },
  },
  plugins: [],
};
