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
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideDown': 'slideDown 0.5s ease-in-out',
        'shine': 'shine 2s linear infinite',
        'scale-98': 'scale98 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scale98: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.98)' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      scale: {
        '98': '0.98',
        '105': '1.05',
        '110': '1.10',
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