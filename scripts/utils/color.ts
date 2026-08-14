const wrap = (code: number) => (text: string) => `\x1b[${code}m${text}\x1b[0m`;

/** `paint.green("db")`. Hand the function itself around when the colour is data. */
export const paint = {
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  blue: wrap(34),
  magenta: wrap(35),
  cyan: wrap(36),
};

export type Color = keyof typeof paint;
