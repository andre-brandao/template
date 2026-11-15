import { getContext, setContext } from "svelte";
import { local, weekStart, type Weekday } from "./day";

export type Dates = {
  locale: string;
  zone: string;
  /** Defaults to the locale's own week start. */
  weekStart?: Weekday;
  /** How a picked day reads; defaults to `{ dateStyle: 'medium' }`. */
  format?: Intl.DateTimeFormatOptions;
};

const key = Symbol("dates");

/** Pass a `$state` object when the user's locale or zone can change. */
export function setDates(cfg: Dates) {
  return setContext(key, cfg);
}

/** The nearest `setDates`, falling back to the runtime's locale and zone. */
export function dates() {
  const cfg = getContext<Dates | undefined>(key);
  const locale = () =>
    cfg?.locale ?? (typeof navigator === "undefined" ? "en-US" : navigator.language);
  return {
    get locale() {
      return locale();
    },
    get zone() {
      return cfg?.zone ?? local();
    },
    get weekStart() {
      return cfg?.weekStart ?? weekStart(locale());
    },
    get format() {
      return cfg?.format ?? ({ dateStyle: "medium" } as const);
    },
  };
}
