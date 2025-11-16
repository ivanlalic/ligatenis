import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f5',
          100: '#fce7ec',
          200: '#faccdb',
          300: '#f7a1bd',
          400: '#f26897',
          500: '#e93d74',
          600: '#d41f5d',
          700: '#b51549',
          800: '#961442',
          900: '#7A1F3D', // Granate principal
          950: '#5A1730', // Granate oscuro
        },
        celeste: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#A4D9F3',
          400: '#87CEEB', // Celeste principal
          500: '#5FAFDB',
          600: '#0ea5e9',
          700: '#0284c7',
          800: '#0369a1',
          900: '#075985',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
