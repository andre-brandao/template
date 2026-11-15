import { zone, type Prefs } from "@template/core/user/prefs";
import { fromDay, toDay } from "@template/ui/day";
import { user } from "./context";

// A fixed instant, so the format pickers preview the same date every time.
export const SAMPLE = new Date("2024-03-12T09:30:00.000Z");

// The stored zone, never the browser's: a server render has no browser to ask, and
// disagreeing with it is a hydration mismatch on every timestamp.
const opts = (prefs: Prefs) => ({ timeZone: zone(prefs) }) as const;

// Building a formatter costs far more than formatting, and a list formats hundreds of
// dates, so each locale and style is built once.
const cache = new Map<string, Intl.DateTimeFormat>();
function format(locale: string, style: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(style)}`;
  const hit = cache.get(key) ?? new Intl.DateTimeFormat(locale, style);
  cache.set(key, hit);
  return hit;
}

/**
 * `Intl` has no way to force field order, so anything but `system` is reassembled from
 * parts. The month name still comes from the locale.
 */
export function date(value: string | Date, prefs: Prefs) {
  const when = new Date(value);
  const style = { ...opts(prefs), year: "numeric", month: "short", day: "numeric" } as const;
  const intl = format(prefs.locale, style);
  if (prefs.date === "system") return intl.format(when);

  const parts = intl.formatToParts(when);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const [d, m, y] = [part("day"), part("month"), part("year")];

  if (prefs.date === "dmy") return `${d} ${m} ${y}`;
  if (prefs.date === "ymd") return `${y} ${m} ${d}`;
  return `${m} ${d}, ${y}`;
}

export function time(value: string | Date, prefs: Prefs) {
  const when = new Date(value);
  const style = { ...opts(prefs), hour: "numeric", minute: "2-digit" } as const;
  if (prefs.time === "system") return format(prefs.locale, style).format(when);
  return format(prefs.locale, { ...style, hour12: prefs.time === "h12" }).format(when);
}

export const stamp = (value: string | Date, prefs: Prefs) =>
  `${date(value, prefs)} · ${time(value, prefs)}`;

/** Relative for the first month, then an absolute date in the user's format. */
export function ago(iso: string, prefs: Prefs) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return date(iso, prefs);
}

/** The zone the browser resolves — what `zone: null` means in practice. */
export const local = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** A planned date as its day in the zone; legacy UTC-midnight values keep their UTC day. */
function day(value: string | Date, prefs: Prefs) {
  const where = zone(prefs);
  return date(fromDay(toDay(value, where), where), prefs);
}

/**
 * Formatters bound to the signed-in user's preferences. Call during component init —
 * it reads context — then use the returned helpers anywhere in the template.
 */
export function fmt() {
  const me = user();
  return {
    date: (value: string | Date) => date(value, me.prefs),
    day: (value: string | Date) => day(value, me.prefs),
    time: (value: string | Date) => time(value, me.prefs),
    stamp: (value: string | Date) => stamp(value, me.prefs),
    ago: (iso: string) => ago(iso, me.prefs),
    number: (value: number, opts?: Intl.NumberFormatOptions) =>
      value.toLocaleString(me.prefs.locale, opts),
    get locale() {
      return me.prefs.locale;
    },
    get zone() {
      return zone(me.prefs);
    },
  };
}
