/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4338ca",
        "primary-focus": "#3730a3",
        secondary: "#6366f1",
        "secondary-focus": "#4f46e5",
        accent: "#818cf8",
        "accent-focus": "#6366f1",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#4338ca",
          "primary-focus": "#3730a3",
          secondary: "#6366f1",
          "secondary-focus": "#4f46e5",
          accent: "#818cf8",
          "accent-focus": "#6366f1",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f3f4f6",
          "base-300": "#e5e7eb",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#818cf8",
          "primary-focus": "#6366f1",
          secondary: "#6366f1",
          "secondary-focus": "#4f46e5",
          accent: "#4338ca",
          "accent-focus": "#3730a3",
          "base-200": "#1e293b",
          "base-300": "#0f172a",
        },
      },
    ],
  },
} 