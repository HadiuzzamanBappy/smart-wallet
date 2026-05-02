/** @type {import('tailwindcss').Config} */
module.exports = {
  // Use class strategy so toggling the 'dark' class on the root element controls dark mode
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#14b8a6', // teal-500
          blue: '#2563eb', // blue-600
          navy: '#0f172a', // slate-900
          rose: '#f43f5e', // rose-500
          amber: '#f59e0b', // amber-500
        },
        primary: {
          50: '#f0fdfa',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

