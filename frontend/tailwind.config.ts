import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette – warm stone, deep forest, slate charcoal, sand/gold accents
        stone: { DEFAULT: "#F5F3EE", deep: "#EBE7DD", line: "#DDD7C8" },
        forest: { DEFAULT: "#1F3B2D", dark: "#16291F", soft: "#2F5642", mist: "#DCE5DF" },
        slate: { DEFAULT: "#272B2A", soft: "#4A504E", muted: "#6E7572" },
        sand: { DEFAULT: "#C9AE7C", dark: "#A98B55", light: "#E8DABB" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(31,59,45,0.25)",
        lift: "0 24px 50px -20px rgba(31,59,45,0.35)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
