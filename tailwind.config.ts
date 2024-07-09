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
      }
    },
  },

  plugins: [daysyui],
  daisyui: {
    themes,
    logs: false,
  },
} as Config
