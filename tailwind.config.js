/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0c0d0e',
        canvas: {
          DEFAULT: '#131417',
          soft: '#0f1013',
          elevated: '#181a1e',
        },
        border: {
          DEFAULT: '#26282f',
          soft: '#1c1e22',
          strong: '#363943',
        },
        foreground: {
          DEFAULT: '#ededed',
          heading: '#fafafa',
          muted: '#9ca3af',
          tertiary: '#6b7280',
        },
        obsidian: {
          950: '#0c0d0e',
          900: '#131417',
          850: '#181a1e',
          800: '#1f2127',
          750: '#272931',
          700: '#2e313b',
          600: '#424654',
        },
        profit: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
          bg: 'rgba(16, 185, 129, 0.08)',
          border: 'rgba(16, 185, 129, 0.22)',
        },
        loss: {
          DEFAULT: '#f43f5e',
          light: '#fb7185',
          dark: '#e11d48',
          bg: 'rgba(244, 63, 94, 0.08)',
          border: 'rgba(244, 63, 94, 0.22)',
        },
        caution: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
          bg: 'rgba(245, 158, 11, 0.08)',
          border: 'rgba(245, 158, 11, 0.22)',
        },
        brand: {
          DEFAULT: '#fafafa',
          foreground: '#0c0d0e',
        }
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'xs': '3px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        'pill': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.4)',
        'md': '0 2px 10px rgba(0, 0, 0, 0.5)',
        'panel': '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
      }
    },
  },
  plugins: [],
}
