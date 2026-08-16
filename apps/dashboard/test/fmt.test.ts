import { describe, it, expect } from "bun:test";
import { DEFAULTS } from "@template/core/user/prefs";
import { ago, date, stamp, time } from "../src/lib/utils/fmt";

const before = (ms: number) => new Date(Date.now() - ms).toISOString();
const SAMPLE = new Date("2024-03-12T09:30:00.000Z");
const sp = { ...DEFAULTS, zone: "America/Sao_Paulo" };

describe("ago", () => {
  it("returns 'just now' for under a minute", () => {
    expect(ago(before(10_000), DEFAULTS)).toBe("just now");
  });

  it("returns minutes for under an hour", () => {
    expect(ago(before(5 * 60_000), DEFAULTS)).toBe("5m ago");
  });

  it("returns hours for under a day", () => {
    expect(ago(before(3 * 3_600_000), DEFAULTS)).toBe("3h ago");
  });

  it("returns days for under a month", () => {
    expect(ago(before(5 * 86_400_000), DEFAULTS)).toBe("5d ago");
  });

  it("falls back to the user's date format for a month or older", () => {
    const iso = before(40 * 86_400_000);
    const prefs = { ...DEFAULTS, date: "ymd" } as const;
    expect(ago(iso, prefs)).toBe(date(iso, prefs));
  });
});

describe("date", () => {
  it("orders the fields per the preference", () => {
    expect(date(SAMPLE, { ...sp, date: "mdy" })).toBe("Mar 12, 2024");
    expect(date(SAMPLE, { ...sp, date: "dmy" })).toBe("12 Mar 2024");
    expect(date(SAMPLE, { ...sp, date: "ymd" })).toBe("2024 Mar 12");
  });

  it("takes the month name from the locale", () => {
    expect(date(SAMPLE, { ...sp, locale: "pt-BR", date: "dmy" })).toContain("mar");
  });

  it("resolves the instant in the chosen zone", () => {
    // 09:30 UTC is still the 11th in Honolulu.
    expect(date(SAMPLE, { ...DEFAULTS, zone: "Pacific/Honolulu", date: "mdy" })).toBe(
      "Mar 11, 2024",
    );
  });
});

describe("time", () => {
  it("honours the 12/24 hour preference", () => {
    expect(time(SAMPLE, { ...sp, time: "h12" })).toBe("6:30 AM");
    expect(time(SAMPLE, { ...sp, time: "h24" })).toBe("06:30");
  });
});

describe("stamp", () => {
  it("joins the date and time", () => {
    expect(stamp(SAMPLE, { ...sp, date: "dmy", time: "h24" })).toBe("12 Mar 2024 · 06:30");
  });
});
