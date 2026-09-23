import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#020617",
          light: "#0f172a",
          lighter: "#1e293b",
        },
        accent: {
          DEFAULT: "#38bdf8",
          dim: "#0ea5e9",
          deep: "#0284c7",
        },
        paper: "#FFFFFF",
      },
      borderRadius: {
        card: "1rem",
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-delayed": "float 7s ease-in-out 2.5s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;