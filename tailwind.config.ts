import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        "2xl": "0rem",
      },
      screens: {
        sm: "576px",
        md: "768px",
        lg: "992px",
        xl: "1200px",
        "2xl": "1442px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0084C7", // Rango Electric Cyan / Ocean Blue
          hover: "#006DA6",
          light: "#E0F2FE",
          5: "rgba(0, 132, 199, 0.05)",
          10: "rgba(0, 132, 199, 0.1)",
          80: "rgba(0, 132, 199, 0.8)",
        },
        secondary: {
          DEFAULT: "#FF7A00", // Rango Energetic Orange
          hover: "#E66E00",
          light: "#FFF7ED",
        },
        danger: "#F23737",
        brand: {
          dark: "#0F172A",
          gray: "#1E293B",
          muted: "#475569",
          light: "#F8FAFC",
          orange: "#FF7A00",
          blue: "#0084C7",
          cyan: "#00A3E0",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
        mono: ["var(--font-poppins)", "Poppins", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      screens: {
        xs: "480px",
        "2.2xl": "1442px",
        "3xl": "1600px",
      },
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "7.5": "1.875rem",
        "12.5": "3.125rem",
        "15": "3.75rem",
        "17.5": "4.375rem",
      },
      borderRadius: {
        quarter: "6.25rem",
        "8.5xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
