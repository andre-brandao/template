import { z } from "zod";

export const Themes = ["system", "light", "dark"] as const;
export const Locales = ["en", "pt-BR", "es", "fr", "de"] as const;
export const Dates = ["system", "mdy", "dmy", "ymd"] as const;
export const Times = ["system", "h12", "h24"] as const;

/**
 * Display preferences. Formatting is done with `Intl`, so the date/time values are
 * semantic (`mdy`, `h12`) rather than format patterns. Every field has a default, so
 * `Prefs.parse({})` yields a complete object.
 */
export const Prefs = z.object({
  theme: z.enum(Themes).default("system"),
  locale: z.enum(Locales).default("en"),
  /** An IANA zone name, or null to follow whatever zone the browser resolves. */
  zone: z.string().nullable().default(null),
  date: z.enum(Dates).default("system"),
  time: z.enum(Times).default("system"),
});
export type Prefs = z.infer<typeof Prefs>;

export const DEFAULTS = Prefs.parse({});

// `.partial()` wraps the optional *outside* the default, so parsing still fills every
// absent key — `Prefs.partial().parse({ theme: "light" })` returns all five fields. Merged
// into jsonb that would reset the other four on every write. Dropping the default first is
// what makes this an actual patch.
export const Patch = z.object({
  theme: Prefs.shape.theme.removeDefault().optional(),
  locale: Prefs.shape.locale.removeDefault().optional(),
  zone: Prefs.shape.zone.removeDefault().optional(),
  date: Prefs.shape.date.removeDefault().optional(),
  time: Prefs.shape.time.removeDefault().optional(),
});
export type Patch = z.infer<typeof Patch>;
