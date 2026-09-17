/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yrupink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777', // Vibrant magenta/pink
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        yrugray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827', // Sleek dark gray
          950: '#030712',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans Thai"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
