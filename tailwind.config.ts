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
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;