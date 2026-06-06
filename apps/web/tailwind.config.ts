import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          base: "#0A1118",
          card: "rgba(18, 30, 45, 0.75)",
          cardHover: "rgba(25, 40, 60, 0.95)"
        }
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;