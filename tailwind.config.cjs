/** @type {import('tailwindcss').Config} */

// Minimal helper to auto-generate shades (50-950) from a single HEX color
function generateScale(hex) {
  // Helper to lighten/darken hex colors
  const adjust = (color, amount) => {
    const clamp = (val) => Math.min(Math.max(val, 0), 255);
    const num = parseInt(color.slice(1), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

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
        // Just provide the main HEX code here
        primary: generateScale('#14b8a6'),
        secondary: generateScale('#8b5cf6'),
        success: generateScale('#10b981'),
        warning: generateScale('#f59e0b'),
        error: generateScale('#f43f5e'),
        info: generateScale('#2563eb'),

        // Custom Neutrals (Non-stark white/black)
        paper: generateScale('#fafafa'),
        ink: generateScale('#020617'),

        surface: {
          light: '#fafafa',
          dark: '#020617',
          card: '#ffffff',
          'card-dark': '#0f172a',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.2)',
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
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
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
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
