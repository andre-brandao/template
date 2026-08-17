import { z } from "zod";

export const Themes = ["system", "light", "dark"] as const;
export const Locales = ["en", "pt-BR", "es", "fr", "de"] as const;
export const Dates = ["system", "mdy", "dmy", "ymd"] as const;
export const Times = ["system", "h12", "h24"] as const;

/**
 * Whether `Intl` will format in this zone. Asked by construction, not by membership of
 * `Intl.supportedValuesOf("timeZone")` — engines disagree on that list (V8 omits `UTC`,
 * JSC includes it), so a browser would reject the zone its own server just stored.
 */
function known(name: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: name });
    return true;
  } catch {
    return false;
  }
}

const Zone = z.string().max(64).refine(known, "Unknown time zone");

/**
 * Display preferences. Formatting is done with `Intl`, so the date/time values are
 * semantic (`mdy`, `h12`) rather than format patterns. Every field has a default, so
 * `Prefs.parse({})` yields a complete object.
 */
export const Prefs = z.object({
  theme: z.enum(Themes).default("system"),
  locale: z.enum(Locales).default("en"),
  /** Where the user is. Null until the browser reports it once; theirs to change after. */
  zone: Zone.nullable().default(null),
  date: z.enum(Dates).default("system"),
  time: z.enum(Times).default("system"),
});
export type Prefs = z.infer<typeof Prefs>;

export const DEFAULTS = Prefs.parse({});

/**
 * The zone to render a user's times in. UTC until a browser has reported one — a job and
 * a server render have no device to ask, and guessing the server's zone would be worse.
 */
export const zone = (prefs: Prefs) => prefs.zone ?? "UTC";

// `.removeDefault().optional()` keeps absent keys absent, so the jsonb merge is a real
// patch — plain `.partial()` would fill defaults and reset the other fields on every write.
export const Patch = z.object({
  theme: Prefs.shape.theme.removeDefault().optional(),
  locale: Prefs.shape.locale.removeDefault().optional(),
  zone: Prefs.shape.zone.removeDefault().optional(),
  date: Prefs.shape.date.removeDefault().optional(),
  time: Prefs.shape.time.removeDefault().optional(),
});
export type Patch = z.infer<typeof Patch>;
