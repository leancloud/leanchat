import type { Config } from 'tailwindcss';

export default {
  content: ['./src/App/Panel/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2c96e8',
          50: '#f0faff',
          100: '#ddf2fd',
          200: '#bfeafd',
          300: '#93dffb',
          400: '#64cbf7',
          500: '#3fb1f3',
          600: '#2c96e8',
          700: '#207dd5',
          800: '#2064ac',
          900: '#205688',
          950: '#183553',
        },
      },
    },
  },
} satisfies Config;
