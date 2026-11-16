import { last, shift, week, type Day, type Range, type Weekday } from "./day";

export type PresetContext = { end: Day; weekStart: Weekday };
export type PeriodPreset = {
  key: string;
  label: string;
  short?: string;
  range: Range | ((ctx: PresetContext) => Range);
};
export type PeriodOption = number | PeriodPreset;

export const trailing = (days: number, label = days === 365 ? "Last year" : `Last ${days} days`) =>
  ({
    key: `last-${days}`,
    label,
    short: days === 365 ? "1y" : `${days}d`,
    range: ({ end }: PresetContext) => last(days, end),
  }) satisfies PeriodPreset;

export const preset = {
  today: {
    key: "today",
    label: "Today",
    short: "1d",
    range: ({ end }) => ({ start: end, end }),
  },
  yesterday: {
    key: "yesterday",
    label: "Yesterday",
    short: "-1d",
    range: ({ end }) => {
      const day = shift(end, { days: -1 });
      return { start: day, end: day };
    },
  },
  week: {
    key: "this-week",
    label: "This week",
    short: "WTD",
    range: ({ end, weekStart }) => ({ start: week(end, weekStart), end }),
  },
  month: {
    key: "this-month",
    label: "This month",
    short: "MTD",
    range: ({ end }) => ({ start: `${end.slice(0, 8)}01`, end }),
  },
  year: {
    key: "this-year",
    label: "This year",
    short: "YTD",
    range: ({ end }) => ({ start: `${end.slice(0, 4)}-01-01`, end }),
  },
} satisfies Record<string, PeriodPreset>;

export const defaultPresets: PeriodOption[] = [
  preset.today,
  preset.yesterday,
  trailing(7),
  trailing(30),
  preset.week,
  preset.month,
  preset.year,
];

export function resolve(input: PeriodOption, ctx: PresetContext): PeriodPreset & { range: Range } {
  const option = typeof input === "number" ? trailing(input) : input;
  return {
    ...option,
    range: typeof option.range === "function" ? option.range(ctx) : option.range,
  };
}
