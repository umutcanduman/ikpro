/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eeeeff',
          100: '#d8d7ff',
          200: '#b8b5ff',
          300: '#8f8aff',
          400: '#6a62ff',
          500: '#3A2CFF',
          600: '#2d1fe6',
          700: '#2318bf',
          800: '#1c1499',
          900: '#150f7a',
        },
        surface: {
          DEFAULT: '#FAFAFA',
          card: '#FFFFFF',
          muted: '#F4F4F6',
        },
        ink: {
          DEFAULT: '#0F0F1A',
          secondary: '#4A4A5A',
          muted: '#8A8A9A',
          placeholder: '#BBBBC8',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-plus-jakarta)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(58, 44, 255, 0.15)',
        'glow-sm': '0 0 20px rgba(58, 44, 255, 0.1)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in': 'slideIn 0.4s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(58, 44, 255, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(58, 44, 255, 0.25)' },
        },
      },
    },
  },
  plugins: [],
}
