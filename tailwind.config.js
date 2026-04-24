/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#05070d',
        panel: '#0a1020',
        panel2: '#0f1830',
        accent: '#4fd0ff',
        accent2: '#7b7bff',
        gold: '#ffd36b',
        rank: {
          e: '#7a7f8a',
          d: '#3fb27f',
          c: '#3f86ff',
          b: '#a855f7',
          a: '#f59e0b',
          s: '#ef4444',
          n: '#f43f5e',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(79,208,255,0.35), 0 0 24px rgba(79,208,255,0.15)',
      },
    },
  },
  plugins: [],
};
