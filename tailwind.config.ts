import type { Config } from 'tailwindcss'
import daysyui from 'daisyui'

import { themes } from './src/lib'
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {},
  },

  plugins: [daysyui],
  daisyui: {
    themes,
  },
} as Config
