/** @type {import('tailwindcss').Config} */

function generateScale(hex, isDark = false) {
  const adjust = (color, amount) => {
    const clamp = (val) => Math.min(Math.max(val, 0), 255);
    const num = parseInt(color.slice(1), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  if (isDark) {
    return {
      50: adjust(hex, 160),
      100: adjust(hex, 130),
      200: adjust(hex, 100),
      300: adjust(hex, 70),
      400: adjust(hex, 40),
      500: hex,
      600: adjust(hex, -5),
      700: adjust(hex, -10),
      800: adjust(hex, -15),
      900: adjust(hex, -20),
      950: adjust(hex, -25),
    };
  }
  return {
    50: adjust(hex, 220),
    100: adjust(hex, 180),
    200: adjust(hex, 140),
    300: adjust(hex, 100),
    400: adjust(hex, 50),
    500: hex,
    600: adjust(hex, -20),
    700: adjust(hex, -40),
    800: adjust(hex, -60),
    900: adjust(hex, -80),
    950: adjust(hex, -100),
  };
}

module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: generateScale('#14b8a6'),
        secondary: generateScale('#8b5cf6'),
        success: generateScale('#10b981'),
        warning: generateScale('#f59e0b'),
        error: generateScale('#f43f5e'),
        info: generateScale('#2563eb'),

        paper: generateScale('#fafafa'),
        ink: generateScale('#0f172a', true),

        surface: {
          light: '#f1f1f1',
          dark: '#0f172a',
          card: '#fafafa',
          'card-dark': '#172033',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        'glass-dark': '0 12px 40px 0 rgba(0, 0, 0, 0.4)',
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.2)',
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      fontSize: {
        // Executive Typographic Scale (Ultra-Thin)
        'h1': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.05em', fontWeight: '400' }],
        'h2': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.04em', fontWeight: '400' }],
        'h3': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.03em', fontWeight: '500' }],
        'h4': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em', fontWeight: '500' }],
        'h5': ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em', fontWeight: '500' }],
        'h6': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0', fontWeight: '500' }],

        // UI & Content
        'body': ['14px', { lineHeight: '1.2rem', letterSpacing: '-0.01em', fontWeight: '300' }],
        'label': ['11px', { lineHeight: '1rem', letterSpacing: '0.1em', fontWeight: '500' }],
        'overline': ['10px', { lineHeight: '1rem', letterSpacing: '0.1em', fontWeight: '500' }],
        'button': ['14px', { lineHeight: '1rem', letterSpacing: '0.02em', fontWeight: '500' }],
        'nano': ['10px', { lineHeight: '0.75rem', letterSpacing: '0.1em', fontWeight: '300' }],

        // Data Values
        'value': ['14px', { lineHeight: '1.25rem', letterSpacing: '-0.02em', fontWeight: '300' }],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}
