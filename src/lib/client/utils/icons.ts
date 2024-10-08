interface SVGoptions {
  width?: number
  height?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  strokeLinecap?: string
  strokeLinejoin?: string
}

const DEFAULT_SVG_OPTIONS: SVGoptions = {
  width: 24,
  height: 24,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function svgTemplate(inner: string, options: SVGoptions = DEFAULT_SVG_OPTIONS) {
  const {
    width = 24,
    height = 24,
    fill = 'none',
    stroke = 'currentColor',
    strokeWidth = 2,
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
  } = options
  return ` <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 24 24"
      fill="${fill}"
      stroke="${stroke}"
      stroke-width="${strokeWidth}"
      stroke-linecap="${strokeLinecap}"
      stroke-linejoin="${strokeLinejoin}"
    >
      ${inner}
    </svg>`
}

export const icons = {
  bug: (cfg?: SVGoptions) =>
    svgTemplate(
      ` <path d="m8 2 1.88 1.88" />
        <path d="M14.12 3.88 16 2" />
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
        <path
          d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"
        />
        <path d="M12 20v-9" />
        <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
        <path d="M6 13H2" />
        <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
        <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
        <path d="M22 13h-4" />
        <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />`,
      cfg,
    ),
  pallete: (cfg?: SVGoptions) =>
    svgTemplate(
      `<circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path
        d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"
      />`,
      cfg,
    ),

  user: (cfg?: SVGoptions) =>
    svgTemplate(
      `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
      cfg,
    ),

  logout: (cfg?: SVGoptions) =>
    svgTemplate(
      `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />`,
      cfg,
    ),

  login: (cfg?: SVGoptions) =>
    svgTemplate(
      `<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" x2="3" y1="12" y2="12" />`,
      cfg,
    ),

  cart: (cfg?: SVGoptions) =>
    svgTemplate(
      `<circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path
            d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
        />`,
      cfg,
    ),

  home: (cfg?: SVGoptions) =>
    svgTemplate(
      ` <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path
            d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        />`,
      cfg,
    ),

  box: (cfg?: SVGoptions) =>
    svgTemplate(
      `      <path d="m7.5 4.27 9 5.15" />
      <path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
      />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />`,
      cfg,
    ),

  table: (cfg?: SVGoptions) =>
    svgTemplate(
      `<path d="M12 3v18" />
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />`,
      cfg,
    ),

  search: (cfg?: SVGoptions) =>
    svgTemplate(
      `<circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />`,
      cfg,
    ),

  chart: {
    bar: (cfg?: SVGoptions) =>
      svgTemplate(
        `<path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />`,
        cfg,
      ),
    line: (cfg?: SVGoptions) =>
      svgTemplate(`<path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />`, cfg),
  },

  warning: (cfg?: SVGoptions) =>
    svgTemplate(
      `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />`,
      cfg,
    ),
  trash: (cfg?: SVGoptions) =>
    svgTemplate(
      `
<path d="M3 6h18" />
  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  <line x1="10" x2="10" y1="11" y2="17" />
  <line x1="14" x2="14" y1="11" y2="17" />`,
      cfg,
    ),

  flags: {
    getEmojiFlag: (lang: string) => {
      switch (lang) {
        case 'en':
          return '🇺🇸'
        case 'pt':
          return '🇧🇷'
        case 'zh':
          return '🇨🇳'
        case 'es':
          return '🇪🇸'
        case 'fr':
          return '🇫🇷'
        case 'de':
          return '🇩🇪'
        case 'ja':
          return '🇯🇵'
        case 'ko':
          return '🇰🇷'
        case 'ru':
          return '🇷🇺'
        default:
          return '🌐'
      }
    },
  },

  arrows: {
    left_line: (cfg?: SVGoptions) =>
      svgTemplate(
        ` <path d="m9 6-6 6 6 6" />
  <path d="M3 12h14" />
  <path d="M21 19V5" />`,
        cfg,
      ),
  },
}
