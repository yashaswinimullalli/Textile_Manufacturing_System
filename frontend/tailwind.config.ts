import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        factory: {
          navy: {
            900: "#090d16",
            800: "#0f172a",
            700: "#1e293b",
            600: "#334155",
          },
          teal: {
            900: "#134e4a",
            700: "#0f766e",
            600: "#0d9488",
            500: "#14b8a6",
            400: "#2dd4bf",
            100: "#ccfbf1",
            50: "#f0fdfa",
          },
          surface: {
            DEFAULT: "#ffffff",
            subtle: "#f8fafc",
            muted: "#f1f5f9",
            border: "#e2e8f0",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
