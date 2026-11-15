import {
  CalendarDate,
  CalendarDateTime,
  fromAbsolute,
  getDayOfWeek,
  parseDate,
  toZoned,
} from "@internationalized/date";

/** A calendar day, `YYYY-MM-DD`. */
export type Day = string;
export type Range = { start: Day; end: Day };

const names = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof names)[number];

type Instant = string | number | Date;

const DAY = 86_400_000;
const pattern = /^\d{4}-\d{2}-\d{2}$/;

/** The runtime's own zone, or UTC when Intl can't say. */
export function local() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    return "UTC";
  }
}

// `YYYY-MM-DDTHH:mm` on the wall in `zone`. Some ICU builds can't resolve a zone, even
// UTC, so anything Intl rejects falls back to plain UTC math.
function wall(time: number, zone: string) {
  const utc = new Date(time).toISOString().slice(0, 16);
  if (zone === "UTC") return utc;
  try {
    return fromAbsolute(time, zone).toString().slice(0, 16);
  } catch {
    return utc;
  }
}

/** Splits an instant into its day and `HH:mm` in `zone`; midnight reads as no time. */
export function split(instant: Instant, zone: string) {
  const time = new Date(instant).getTime();
  const utc = new Date(time).toISOString();
  // Date-only values written before zones were stored sit on UTC midnight: keep that day.
  const stamp = utc.endsWith("T00:00:00.000Z") ? utc.slice(0, 16) : wall(time, zone);
  return { day: stamp.slice(0, 10), clock: stamp.endsWith("T00:00") ? "" : stamp.slice(11) };
}

/** The day an instant falls on in `zone`. */
export function toDay(instant: Instant, zone: string): Day {
  return split(instant, zone).day;
}

/** The instant `clock` (`HH:mm`, empty for midnight) starts on `day` in `zone`. */
export function at(day: Day, clock: string, zone: string) {
  const date = parseDate(day);
  const parts = (clock || "00:00").split(":").map(Number);
  const utc = `${day}T${clock || "00:00"}:00.000Z`;
  if (zone === "UTC") return utc;
  try {
    return toZoned(
      new CalendarDateTime(date.year, date.month, date.day, parts[0], parts[1]),
      zone,
    ).toAbsoluteString();
  } catch {
    return utc;
  }
}

/** The instant `day` starts in `zone`: what a date-only pick stores. */
export function fromDay(day: Day, zone: string) {
  return at(day, "", zone);
}

/** Today in `zone`; on the server pass the stored zone, never the runtime's. */
export function today(zone = local()): Day {
  return wall(Date.now(), zone).slice(0, 10);
}

export function shift(
  day: Day,
  by: { days?: number; weeks?: number; months?: number; years?: number },
): Day {
  return parseDate(day).add(by).toString();
}

/** The first day of the week in `locale`. */
export function weekStart(locale: string): Weekday {
  // 2023-01-01 was a Sunday; where it sits in the locale's week gives the first day.
  try {
    return names[(7 - getDayOfWeek(new CalendarDate(2023, 1, 1), locale)) % 7];
  } catch {
    return "mon";
  }
}

/** 0 for Sunday, like `Date#getDay`, without touching a zone. */
export function weekday(day: Day) {
  const date = parseDate(day);
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

/** The first day of the week holding `day`. */
export function week(day: Day, first: Weekday) {
  return shift(day, { days: -((weekday(day) - names.indexOf(first) + 7) % 7) });
}

/** Range covering the last `n` days, ending on `from`. */
export function last(n: number, from = today()): Range {
  return { start: shift(from, { days: 1 - n }), end: from };
}

/** Ordered, well-formed and at most `maxSpan` days long. Mirrors the server's `Insights.Range`. */
export function valid(range: Range, maxSpan = 366) {
  if (!pattern.test(range.start) || !pattern.test(range.end)) return false;
  return (
    range.start <= range.end &&
    Math.round((Date.parse(range.end) - Date.parse(range.start)) / DAY) + 1 <= maxSpan
  );
}

/** Formats a day (and an optional `HH:mm`) without handing Intl a zone. */
export function format(day: Day, locale: string, opts: Intl.DateTimeFormatOptions, clock = "") {
  const date = parseDate(day);
  const parts = (clock || "12:00").split(":").map(Number);
  // Built on the local wall clock, so the runtime zone never shifts the day.
  const value = new Date(date.year, date.month - 1, date.day, parts[0], parts[1]);
  try {
    return new Intl.DateTimeFormat(locale, opts).format(value);
  } catch {
    return clock ? `${day} ${clock}` : day;
  }
}

/** Weekday names in the locale's order, starting at `first`. */
export function weekdays(locale: string, first: Weekday, style: "narrow" | "short" | "long") {
  // 2023-01-01 was a Sunday, so 2023-01-0n is weekday n-1.
  return names.map((_, i) => {
    const n = (names.indexOf(first) + i) % 7;
    return { key: names[n], label: format(`2023-01-0${n + 1}`, locale, { weekday: style }) };
  });
}
