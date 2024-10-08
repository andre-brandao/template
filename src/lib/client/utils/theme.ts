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

export interface ThemeColors {
  primary: string
  primaryFocus: string
  primaryContent: string
  secondary: string
  secondaryFocus: string
  secondaryContent: string
  accent: string
  accentFocus: string
  accentContent: string
  neutral: string
  neutralFocus: string
  neutralContent: string
  base100: string
  base200: string
  base300: string
  baseContent: string
  info: string
  infoContent: string
  success: string
  successContent: string
  warning: string
  warningContent: string
  error: string
  errorContent: string
}

export function extractThemeColorsFromDOM(): ThemeColors {
  const computedStyles = getComputedStyle(document.querySelector(':root')!)
  return {
    primary: `oklch(${computedStyles.getPropertyValue('--p')}`,
    primaryFocus: `oklch(${computedStyles.getPropertyValue('--pf')}`,
    primaryContent: `oklch(${computedStyles.getPropertyValue('--pc')}`,
    secondary: `oklch(${computedStyles.getPropertyValue('--s')}`,
    secondaryFocus: `oklch(${computedStyles.getPropertyValue('--sf')}`,
    secondaryContent: `oklch(${computedStyles.getPropertyValue('--sc')}`,
    accent: `oklch(${computedStyles.getPropertyValue('--a')}`,
    accentFocus: `oklch(${computedStyles.getPropertyValue('--af')}`,
    accentContent: `oklch(${computedStyles.getPropertyValue('--ac')}`,
    neutral: `oklch(${computedStyles.getPropertyValue('--n')}`,
    neutralFocus: `oklch(${computedStyles.getPropertyValue('--nf')}`,
    neutralContent: `oklch(${computedStyles.getPropertyValue('--nc')}`,
    base100: `oklch(${computedStyles.getPropertyValue('--b1')}`,
    base200: `oklch(${computedStyles.getPropertyValue('--b2')}`,
    base300: `oklch(${computedStyles.getPropertyValue('--b3')}`,
    baseContent: `oklch(${computedStyles.getPropertyValue('--bc')}`,
    info: `oklch(${computedStyles.getPropertyValue('--in')}`,
    infoContent: `oklch(${computedStyles.getPropertyValue('--inc')}`,
    success: `oklch(${computedStyles.getPropertyValue('--su')}`,
    successContent: `oklch(${computedStyles.getPropertyValue('--suc')}`,
    warning: `oklch(${computedStyles.getPropertyValue('--wa')}`,
    warningContent: `oklch(${computedStyles.getPropertyValue('--wac')}`,
    error: `oklch(${computedStyles.getPropertyValue('--er')}`,
    errorContent: `oklch(${computedStyles.getPropertyValue('--erc')}`,
  }
}
