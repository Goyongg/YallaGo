/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: '#00BD5F',     // main green
        'brand-light': '#A8E2C5', // soft green
        'gray-bg': '#F3F3F3', // background light gray
      },
    },
  },
  plugins: [],
}