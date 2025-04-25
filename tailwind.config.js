import { addDynamicIconSelectors } from '@iconify/tailwind'
import tailwindAnimate from 'tailwindcss-animate'
import tailwindScrollbar from 'tailwind-scrollbar'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{html,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    fontFamily: {
      sans: ['Source Han Sans VF', 'sans-serif'],
      mono: [
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace'
      ]
    },
    extend: {
      fontSize: {
        '7xl': '5rem',
        '2xs': [
          '0.625rem',
          {
            // 10px
            lineHeight: '0.875rem' // 14px
          }
        ]
      },
      boxShadow: {
        'custom-initial': '0 2px 5px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.3)',
        'l-inner': 'inset 2px 0 4px 0 rgb(0 0 0 / 0.05)'
      },
      transitionProperty: {
        border: 'border-color, border-width'
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 6px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        slideInfinite: {
          '0%': { left: '-40%' },
          '50%': { left: '90%' },
          '50.01%': { left: '90%' },
          '100%': { left: '-40%' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-infinite': 'slideInfinite 2.5s ease-in-out infinite'
      },
      screens: {
        '3xl': '1920px'
      }
    }
  },
  plugins: [
    tailwindAnimate,
    addDynamicIconSelectors(),
    tailwindScrollbar({ nocompatible: true, preferredStrategy: 'pseudoelements' }),
    typography
  ]
}
