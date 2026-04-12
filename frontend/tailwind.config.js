/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#c9a84c',
        'gold-light': '#e8c97a',
        'gold-dark': '#a07830',
        dark: '#0a0a0a',
        'dark-card': '#141414',
        'dark-border': '#1e1e1e',
        cream: '#f5f0e8',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Raleway', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c9a84c 0%, #e8c97a 50%, #c9a84c 100%)',
      },
    },
  },
  plugins: [],
};
