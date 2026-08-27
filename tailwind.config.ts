import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f9f9f9',
        ink: '#0f0f0f',
        muted: '#606060',
        line: '#e5e5e5',
        chip: '#f2f2f2',
      },
    },
  },
  plugins: [],
} satisfies Config
