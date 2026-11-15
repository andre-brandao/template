import { CalendarDate, endOfMonth, parseDate } from "@internationalized/date";
import { shift, week, weekday, weekStart, type Day, type Weekday } from "./day";

const words: Record<string, number> = { today: 0, tod: 0, tomorrow: 1, tmr: 1, yesterday: -1 };
const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const units = { d: "days", w: "weeks", m: "months", y: "years" } as const;

// `day`, `month`, `year` in the order the locale writes them.
function order(locale: string) {
  try {
    return new Intl.DateTimeFormat(locale)
      .formatToParts(new Date(2023, 10, 22))
      .map((part) => part.type)
      .filter((type) => type === "day" || type === "month" || type === "year");
  } catch {
    return ["month", "day", "year"];
  }
}

// Rejects what CalendarDate would quietly clamp, like Feb 31.
function make(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1) return;
  const date = new CalendarDate(year, month, day);
  return date.month === month && date.day === day ? date.toString() : undefined;
}

function numeric(text: string, locale: string, now: Day) {
  const parts = text.split(/[/.\-\s]+/).map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some(Number.isNaN)) return;
  // A leading four-digit year reads year first whatever the locale.
  const keys = (parts[0] > 999 ? ["year", "month", "day"] : order(locale)).filter(
    (key) => parts.length === 3 || key !== "year",
  );
  const get = (key: string) => parts[keys.indexOf(key)];
  const year = parts.length === 3 ? get("year") : Number(now.slice(0, 4));
  return make(year < 100 ? 2000 + year : year, get("month"), get("day"));
}

/**
 * Typed entry, English keywords: `today`, `tmr`, `+3d`, `-2w`, `in 3 days`, `fri`,
 * `next fri`, `eow`, `eom`, ISO, or numeric in the locale's order. A bare weekday is the
 * next one after today; `next` lands in the following week.
 */
export function parse(
  text: string,
  opts: { today: Day; locale: string; weekStart?: Weekday },
): Day | undefined {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  const now = opts.today;
  const first = opts.weekStart ?? weekStart(opts.locale);
  if (!t) return;
  if (t in words) return shift(now, { days: words[t] });
  if (t === "eow") return shift(week(now, first), { days: 6 });
  if (t === "eom") return endOfMonth(parseDate(now)).toString();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (iso) return make(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  return relative(t, now) ?? named(t, now, first) ?? numeric(t, opts.locale, now);
}

function relative(text: string, now: Day) {
  const match =
    /^([+-]) ?(\d+) ?([dwmy])?$/.exec(text) ??
    /^(in) (\d+) ?(d|w|m|y)(?:ays?|eeks?|onths?|ears?)?$/.exec(text);
  if (!match) return;
  const unit = units[(match[3] ?? "d") as keyof typeof units];
  return shift(now, { [unit]: match[1] === "-" ? -Number(match[2]) : Number(match[2]) });
}

function named(text: string, now: Day, first: Weekday) {
  const match = /^(next )?([a-z]{3,})$/.exec(text);
  const index = match ? days.findIndex((day) => day.startsWith(match[2])) : -1;
  if (!match || index < 0) return;
  if (!match[1]) return shift(now, { days: (index - weekday(now) + 7) % 7 || 7 });
  const start = days.findIndex((day) => day.startsWith(first));
  return shift(week(now, first), { days: 7 + ((index - start + 7) % 7) });
}
