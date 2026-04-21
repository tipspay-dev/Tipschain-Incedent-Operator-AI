import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        foreground: "#f8fbff",
        card: "#091120",
        border: "rgba(255,255,255,0.1)",
        primary: "#59d6ff",
        secondary: "#9b6dff",
        muted: "#9ba7c2",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0,0,0,0.45)",
      },
      animation: {
        shimmer: "shimmer 1.4s linear infinite",
        float: "float 8s ease-in-out infinite",
        "fade-rise": "fade-rise 700ms ease forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-rise": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
