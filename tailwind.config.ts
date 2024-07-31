import type { Config } from 'tailwindcss'
import daysyui from 'daisyui'

import { themes } from './src/lib'
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/layerchart/**/*.{svelte,js}',
  ],

  theme: {
    extend: {
      gridTemplateColumns: {
        fluid: 'repeat(auto-fit, minmax(15rem, 1fr))',
      },
      colors: {
        'surface-100': 'oklch(var(--b1) / <alpha-value>)',
        'surface-200': 'oklch(var(--b2) / <alpha-value>)',
        'surface-300': 'oklch(var(--b3) / <alpha-value>)',
        'surface-content': 'oklch(var(--bc) / <alpha-value>)',
      },
      // https://animation-svelte.vercel.app/luxe/usage
      animation: {
        flip: 'flip 6s infinite steps(2, end)',
        kitrotate: 'kitrotate 3s linear infinite both',
        shine: 'shine 2s linear infinite',
        slide: 'slide 40s linear infinite',
        spotlight: 'spotlight 2s ease .75s 1 forwards',
        'border-width': 'border-width 3s infinite alternate',
        'text-gradient': 'text-gradient 2s linear infinite',
        'text-shake': 'text-shake 1s ease 1',
        'text-glitch-to': 'text-glitch-to 0.6s ease-in-out infinite',
        'text-glitch-from': 'text-glitch-from 0.6s ease-in-out infinite',
        'text-scale': 'text-scale 1s linear infinite forwards',
        spin: 'spin 2s linear infinite',
        // From UI-Snippets : https://ui.ibelick.com
        // 'text-gradient': 'text-gradient 1.5s linear infinite',
        'background-shine': 'background-shine 2s linear infinite',
        'pulse-slow': 'pulse 6s infinite cubic-bezier(0.4, 0, 0.6, 1)',
        grid: "grid 15s linear infinite",

      },
      keyframes: {
        grid: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },

        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        flip: {
          to: {
            transform: 'rotate(360deg)',
          },
        },
        kitrotate: {
          to: {
            transform: 'rotate(90deg)',
          },
        },
        shine: {
          from: {
            backgroundPosition: '0 0',
          },
          to: {
            backgroundPosition: '-200% 0',
          },
        },
        'border-width': {
          from: {
            width: '10px',
            opacity: '0',
          },
          to: {
            width: '100px',
            opacity: '1',
          },
        },
        'text-gradient': {
          to: {
            backgroundPosition: '200% center',
          },
        },
        'text-shake': {
          '15%': { transform: 'translateX(5px)' },
          '30%': { transform: 'translateX(-5px)' },
          '50%': { transform: 'translateX(3px)' },
          '80%': { transform: 'translateX(2px)' },
          '100%': { transform: 'translateX(0)' },
        },
        'text-glitch-to': {
          from: {
            transform: 'translateY(0)',
          },
          to: {
            transform: 'translateY(-100%)',
          },
        },
        'text-glitch-from': {
          from: {
            transform: 'translateY(100%)',
          },
          to: {
            transform: 'translateY(0)',
          },
        },
        'text-scale': {
          '0%': {
            transform: 'scaleX(0)',
            transformOrigin: 'bottom left',
          },
          '25%': {
            transform: 'scaleX(1)',
            transformOrigin: 'bottom left',
          },
          '75%': {
            transform: 'scaleX(1)',
            transformOrigin: 'bottom right',
          },
          '100%': {
            transform: 'scaleX(0)',
            transformOrigin: 'bottom right',
          },
        },
        slide: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap)))' },
        },
        spotlight: {
          '0%': {
            opacity: '0',
            transform: 'translate(-72%, -62%) scale(0.5)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(-50%,-40%) scale(1)',
          },
        },
        // For Gradient Input, UI-Snippets : https://ui.ibelick.com
        'background-shine': {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      }, // Keyframes
    },
  },

  plugins: [daysyui],
  daisyui: {
    themes,
    logs: false,
  },
} as Config
