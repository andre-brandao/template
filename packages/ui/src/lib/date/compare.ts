import { shift, valid, type Range } from "./day";

export type CompareMode = "previous" | "weekdays" | "year" | "custom";
export type Comparison = { mode: CompareMode; range: Range };

const DAY = 86_400_000;
const days = (range: Range) =>
  Math.round((Date.parse(range.end) - Date.parse(range.start)) / DAY) + 1;
const move = (range: Range, by: number): Range => ({
  start: shift(range.start, { days: by }),
  end: shift(range.end, { days: by }),
});

export function comparison(range: Range, mode: CompareMode, custom?: Range): Comparison {
  if (mode === "custom" && custom && valid(custom)) return { mode, range: custom };
  if (mode === "year") {
    return {
      mode,
      range: {
        start: shift(range.start, { years: -1 }),
        end: shift(range.end, { years: -1 }),
      },
    };
  }
  if (mode === "weekdays") {
    return { mode, range: move(range, -Math.max(7, Math.round(days(range) / 7) * 7)) };
  }
  return {
    mode,
    range: {
      start: shift(range.start, { days: -days(range) }),
      end: shift(range.start, { days: -1 }),
    },
  };
}
