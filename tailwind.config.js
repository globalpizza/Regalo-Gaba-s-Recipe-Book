/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        colors: {
            'brand-cream': '#FFF8F0',
            'brand-pink': '#F7B2B7',
            'brand-pink-dark': '#E56B6F',
            'brand-orange': '#F3D6B1',
            'brand-text': '#725143',
            'brand-bg': '#FFF8F0',
        },
        fontFamily: {
            sans: ['Poppins', 'sans-serif'],
            serif: ['Quicksand', 'serif'],
        },
    }
  },
  plugins: [],
}
