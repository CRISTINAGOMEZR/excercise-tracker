import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50:  '#faf8f5',
          100: '#f4f0ea',
          200: '#e8dfd3',
          300: '#d6c8b5',
        },
        carbon: {
          700: '#3d3d3d',
          800: '#2a2a2a',
          900: '#1a1a1a',
        },
        sage: {
          400: '#8fa880',
          500: '#7a9670',
          600: '#677f5f',
        },
        terracotta: {
          400: '#c4846a',
          500: '#b56f54',
        },
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:  ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
};

export default config;
