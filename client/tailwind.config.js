/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        blueprint: {
          950: "#0B1B2B",
          900: "#0F2438",
          800: "#15324C",
          700: "#1D4262",
          600: "#295879",
          500: "#3B7196",
          100: "#DCE8F0",
          50: "#F0F5F9",
        },
        safety: {
          DEFAULT: "#E8A33D",
          dark: "#C4841F",
        },
        concrete: {
          900: "#2B2E31",
          700: "#565B60",
          400: "#9BA1A6",
          200: "#DFE2E4",
          50: "#F7F8F8",
        },
        signal: {
          red: "#C0463C",
          green: "#3F7D5C",
        },
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
