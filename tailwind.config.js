/** @type {import('tailwindcss').Config} */
/** @type {import('daisyui').Config} */
export default {
  content: [
    "*.tsx",
    "./public/*.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["dark"]
  }
}

