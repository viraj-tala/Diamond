import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#e8edff",
          200: "#c8d3ff",
          300: "#9eb0ff",
          400: "#6f86fb",
          500: "#4a63ef",
          600: "#3447d6",
          700: "#2937ac",
          800: "#222d87",
          900: "#1d2670",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Arial"],
      },
    },
  },
  plugins: [],
};

export default config;
