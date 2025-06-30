import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // === Kupibilet Brand Palette (ОБНОВЛЕННАЯ СХЕМА) ===
        primary: {
          DEFAULT: 'rgb(var(--color-primary))',           /* #4BFF7E - яркий зеленый */
          50: 'rgba(var(--color-primary), 0.1)',
          100: 'rgba(var(--color-primary), 0.2)',
          200: 'rgba(var(--color-primary), 0.3)',
          300: 'rgba(var(--color-primary), 0.4)',
          400: 'rgba(var(--color-primary), 0.5)',
          500: 'rgba(var(--color-primary), 0.6)',
          600: 'rgba(var(--color-primary), 0.7)',
          700: 'rgba(var(--color-primary-dark), 0.8)',
          800: 'rgba(var(--color-primary-dark), 0.9)',
          900: 'rgb(var(--color-primary-dark))',          /* #1DA857 - темно-зеленый */
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary))',         /* #E03EEF - розово-фиолетовый */
          50: 'rgba(var(--color-secondary), 0.1)',
          100: 'rgba(var(--color-secondary), 0.2)',
          200: 'rgba(var(--color-secondary), 0.3)',
          300: 'rgba(var(--color-secondary), 0.4)',
          400: 'rgba(var(--color-secondary), 0.5)',
          500: 'rgba(var(--color-secondary), 0.6)',
          600: 'rgba(var(--color-secondary), 0.7)',
          700: 'rgba(var(--color-secondary), 0.8)',
          800: 'rgba(var(--color-secondary), 0.9)',
          900: 'rgb(var(--color-secondary))',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent))',            /* #FF6240 - оранжево-красный */
          50: 'rgba(var(--color-accent), 0.1)',
          100: 'rgba(var(--color-accent), 0.2)',
          200: 'rgba(var(--color-accent), 0.3)',
          300: 'rgba(var(--color-accent), 0.4)',
          400: 'rgba(var(--color-accent), 0.5)',
          500: 'rgba(var(--color-accent), 0.6)',
          600: 'rgba(var(--color-accent), 0.7)',
          700: 'rgba(var(--color-accent), 0.8)',
          800: 'rgba(var(--color-accent), 0.9)',
          900: 'rgb(var(--color-accent))',
        },
        background: {
          DEFAULT: 'rgb(var(--color-background))',        /* #2C3959 - темный фон */
          light: 'rgb(var(--color-background-light))',
        },
        warning: 'rgb(var(--color-warning))',
        // Glass Colors with transparency
        glass: {
          primary: 'rgba(var(--color-primary), 0.1)',
          secondary: 'rgba(var(--color-primary-dark), 0.1)',
          accent: 'rgba(var(--color-accent), 0.1)',
          modal: 'rgba(var(--color-background), 0.8)',
          border: 'rgba(var(--color-accent), 0.2)',
          'border-dark': 'rgba(var(--color-accent), 0.1)',
        },
      },
      backdropBlur: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      animation: {
        'glass-float': 'glass-float 6s ease-in-out infinite',
        'glass-pulse': 'glass-pulse 4s ease-in-out infinite',
        'glass-shimmer': 'glass-shimmer 2.5s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glass-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glass-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'glass-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(var(--color-accent), 0.5)',
            opacity: '1'
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(var(--color-accent), 0.8)',
            opacity: '0.9'
          },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(var(--color-background), 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(var(--color-background), 0.25)',
        'glass-lg': '0 12px 48px 0 rgba(var(--color-background), 0.45)',
        'glow': '0 0 20px rgba(var(--color-accent), 0.5)',
        'glow-primary': '0 0 20px rgba(var(--color-primary), 0.5)',
        'glow-accent': '0 0 20px rgba(var(--color-accent), 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(var(--color-accent), 0.1) 0%, rgba(var(--color-accent), 0.05) 100%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(var(--color-accent), 0.2), transparent)',
      },
    },
  },
  plugins: [],
}
export default config
