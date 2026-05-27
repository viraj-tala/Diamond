import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // ──────────────────────────────────────────────────────────
        // Brand — Polished onyx (near-black with a faint violet undertone).
        // The colour story of a diamond is white brilliance + the dark
        // negative space behind it. This is that negative space: deep,
        // sophisticated, unmistakably "carbon".
        // ──────────────────────────────────────────────────────────
        brand: {
          50: "#f5f5f7",
          100: "#e8e8ec",
          200: "#cdcdd6",
          300: "#a3a3b3",
          400: "#73738a",
          500: "#52526b",
          600: "#363650",   // primary button background
          700: "#252539",
          800: "#181828",
          900: "#0d0d18",   // near-black
          950: "#06060f",
        },
        // ──────────────────────────────────────────────────────────
        // Iris — singular accent. A refined electric violet that
        // sits at the edge of a diamond's fire spectrum. Used very
        // sparingly: live indicators, premium CTAs, focus rings.
        // ──────────────────────────────────────────────────────────
        iris: {
          50: "#f4f1ff",
          100: "#ebe5ff",
          200: "#d9ceff",
          300: "#bca7ff",
          400: "#9b78ff",
          500: "#7c4dff",
          600: "#6332f5",   // default
          700: "#5320d8",
          800: "#451dad",
          900: "#3a1c89",
        },
        // ──────────────────────────────────────────────────────────
        // Surface — clean, almost-white. The "ice" of the diamond,
        // the page itself, the white grading-report background.
        // ──────────────────────────────────────────────────────────
        surface: {
          DEFAULT: "#fbfbfd",
          subtle: "#f5f5f7",
          elevated: "#ffffff",
          deep: "#0d0d18",
          ink: "#0d0d18",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Arial",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(13 13 24 / 0.04), 0 1px 1px rgb(13 13 24 / 0.03)",
        lift: "0 6px 18px -4px rgb(13 13 24 / 0.10), 0 2px 4px -1px rgb(13 13 24 / 0.05)",
        // Prism-coloured glow used on focus + active states
        glow: "0 0 0 4px rgb(124 77 255 / 0.18)",
        glowDeep:
          "0 10px 28px -10px rgb(124 77 255 / 0.45), 0 4px 8px -4px rgb(124 77 255 / 0.2)",
        inner: "inset 0 1px 0 0 rgb(255 255 255 / 0.7)",
      },
      backgroundImage: {
        // The diamond fire — full visible spectrum. Used ONLY on
        // brand mark, loader, focus glow, premium accent buttons.
        prism:
          "linear-gradient(135deg, #06b6d4 0%, #6366f1 33%, #ec4899 66%, #f59e0b 100%)",
        "prism-soft":
          "linear-gradient(135deg, rgba(6,182,212,0.14) 0%, rgba(99,102,241,0.12) 50%, rgba(236,72,153,0.10) 100%)",
        // Brilliance — the bright iridescent surface of the stone
        brilliance:
          "linear-gradient(135deg, #ffffff 0%, #f5f5f7 60%, #e8e8ec 100%)",
        // Onyx — the dark backdrop
        onyx:
          "linear-gradient(180deg, #06060f 0%, #0d0d18 60%, #181828 100%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        spin3d: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        prismShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        ringPulse: {
          "0%": {
            boxShadow: "0 0 0 0 rgb(124 77 255 / 0.45)",
          },
          "100%": {
            boxShadow: "0 0 0 12px rgb(124 77 255 / 0)",
          },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s linear infinite",
        sparkle: "sparkle 2.4s ease-in-out infinite",
        spin3d: "spin3d 4s linear infinite",
        floatY: "floatY 3s ease-in-out infinite",
        prismShift: "prismShift 8s ease-in-out infinite",
        ringPulse: "ringPulse 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
