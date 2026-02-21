/** @type {import('tailwindcss').Config} */
const accentIndigoScale = {
  50: process.env.BRAND_INDIGO_50 ?? '#eef2ff',
  100: process.env.BRAND_INDIGO_100 ?? '#e0e7ff',
  200: process.env.BRAND_INDIGO_200 ?? '#c7d2fe',
  300: process.env.BRAND_INDIGO_300 ?? '#a5b4fc',
  400: process.env.BRAND_INDIGO_400 ?? '#818cf8',
  500: process.env.BRAND_INDIGO_500 ?? '#6366f1',
  600: process.env.BRAND_INDIGO_600 ?? '#4f46e5',
  700: process.env.BRAND_INDIGO_700 ?? '#4338ca',
  800: process.env.BRAND_INDIGO_800 ?? '#3730a3',
  900: process.env.BRAND_INDIGO_900 ?? '#312e81'
};

const accentSkyScale = {
  50: process.env.BRAND_SKY_50 ?? '#f0f9ff',
  100: process.env.BRAND_SKY_100 ?? '#e0f2fe',
  200: process.env.BRAND_SKY_200 ?? '#bae6fd',
  300: process.env.BRAND_SKY_300 ?? '#7dd3fc',
  400: process.env.BRAND_SKY_400 ?? '#38bdf8',
  500: process.env.BRAND_SKY_500 ?? '#0ea5e9',
  600: process.env.BRAND_SKY_600 ?? '#0284c7',
  700: process.env.BRAND_SKY_700 ?? '#0369a1',
  800: process.env.BRAND_SKY_800 ?? '#075985',
  900: process.env.BRAND_SKY_900 ?? '#0c4a6e'
};

const accentFuchsiaScale = {
  50: process.env.BRAND_FUCHSIA_50 ?? '#fdf4ff',
  100: process.env.BRAND_FUCHSIA_100 ?? '#fae8ff',
  200: process.env.BRAND_FUCHSIA_200 ?? '#f5d0fe',
  300: process.env.BRAND_FUCHSIA_300 ?? '#f0abfc',
  400: process.env.BRAND_FUCHSIA_400 ?? '#e879f9',
  500: process.env.BRAND_FUCHSIA_500 ?? '#d946ef',
  600: process.env.BRAND_FUCHSIA_600 ?? '#c026d3',
  700: process.env.BRAND_FUCHSIA_700 ?? '#a21caf',
  800: process.env.BRAND_FUCHSIA_800 ?? '#86198f',
  900: process.env.BRAND_FUCHSIA_900 ?? '#701a75'
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'accent-indigo': accentIndigoScale,
        'accent-sky': accentSkyScale,
        'accent-fuchsia': accentFuchsiaScale
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Noto Sans TC', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.6rem'
      },
      boxShadow: {
        premium: '0 18px 40px rgba(15, 23, 42, 0.12)'
      }
    }
  },
  plugins: []
};
