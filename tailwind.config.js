/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        heaven: {
          50: '#F9F9F9',
          100: '#F2F2F2',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        luxury: {
          gold: '#C5A059',
          'gold-light': '#DFC48A',
          'gold-dark': '#9A7836',
          pearl: '#FAFAF9',
          border: '#E8E8E8',
          subtle: '#8C8C8C',
          dark: '#111111'
        }
      },
      fontFamily: {
        serif: ['var(--font-cinzel)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-montserrat)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        'widest-luxury': '0.25em',
        'sublime': '0.35em',
      }
    },
  },
  plugins: [],
};
