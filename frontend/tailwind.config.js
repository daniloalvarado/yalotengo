/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter','ui-sans-serif','system-ui'] },
      colors: {
        brand: {
          50:"#eef8ff",100:"#d8eeff",200:"#b9deff",300:"#8eccff",
          400:"#55b1ff",500:"#1f95ff",600:"#0d79e6",700:"#0b62b8",
          800:"#0d5191",900:"#0f4576"
        },
        ink: { 900:"#0f172a", 700:"#1e293b", 500:"#334155" },
        muted:"#f6f7f9"
      },
      boxShadow: {
        soft:"0 10px 25px -10px rgba(2,6,23,.15)",
        card:"0 1px 2px rgba(0,0,0,.06), 0 10px 20px -12px rgba(2,6,23,.10)"
      },
      borderRadius: { xl2:"1.1rem" }
    }
  },
  plugins: [],
}
