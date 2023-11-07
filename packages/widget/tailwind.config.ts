import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        text: 'var(--color-text)',
      },
    },
  },
  plugins: [],
} satisfies Config;
