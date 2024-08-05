// place files you want to import through the `$lib` alias in this folder.
export const themes = [
  'bumblebee',
  'light',
  'dark',
  'cupcake',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset',
] as const

export type Theme = (typeof themes)[number]

export function changeTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}
