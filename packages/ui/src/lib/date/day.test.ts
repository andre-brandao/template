import { describe, expect, test } from "bun:test";
import { at, fromDay, last, shift, split, toDay, today, valid, weekStart } from "./day";

describe("zones", () => {
  test("fromDay stores the start of the day in the zone", () => {
    expect(fromDay("2026-11-15", "Asia/Tokyo")).toBe("2026-11-14T15:00:00.000Z");
    expect(fromDay("2026-11-15", "America/Sao_Paulo")).toBe("2026-11-15T03:00:00.000Z");
  });

  test("toDay reads the day back in the zone it was picked in", () => {
    expect(toDay(fromDay("2026-11-15", "Asia/Tokyo"), "Asia/Tokyo")).toBe("2026-11-15");
    expect(toDay("2026-11-15T23:30:00.000Z", "Pacific/Kiritimati")).toBe("2026-11-16");
    expect(toDay("2026-11-15T01:00:00.000Z", "America/Sao_Paulo")).toBe("2026-11-14");
  });

  test("at keeps the wall clock across a DST change", () => {
    expect(at("2026-03-07", "09:00", "America/New_York")).toBe("2026-03-07T14:00:00.000Z");
    expect(at("2026-03-09", "09:00", "America/New_York")).toBe("2026-03-09T13:00:00.000Z");
    expect(split("2026-03-09T13:00:00.000Z", "America/New_York")).toEqual({
      day: "2026-03-09",
      clock: "09:00",
    });
  });

  test("midnight in the zone reads as no time", () => {
    expect(split(fromDay("2026-11-15", "America/Sao_Paulo"), "America/Sao_Paulo")).toEqual({
      day: "2026-11-15",
      clock: "",
    });
  });
});

describe("legacy UTC midnight", () => {
  test("stays on its UTC day west of UTC", () => {
    expect(toDay("2026-11-15T00:00:00.000Z", "America/Los_Angeles")).toBe("2026-11-15");
    expect(split(new Date("2026-11-15T00:00:00.000Z"), "America/Los_Angeles").clock).toBe("");
  });

  test("stays on its UTC day east of UTC", () => {
    expect(toDay("2026-11-15T00:00:00.000Z", "Asia/Tokyo")).toBe("2026-11-15");
  });
});

describe("UTC fallback", () => {
  test("a zone Intl rejects falls back to UTC math", () => {
    expect(toDay("2026-11-15T23:30:00.000Z", "Not/AZone")).toBe("2026-11-15");
    expect(fromDay("2026-11-15", "Not/AZone")).toBe("2026-11-15T00:00:00.000Z");
    expect(today("Not/AZone")).toBe(new Date().toISOString().slice(0, 10));
  });

  test("UTC never asks Intl", () => {
    expect(at("2026-11-15", "08:30", "UTC")).toBe("2026-11-15T08:30:00.000Z");
  });

  test("an unknown locale still gets a week start", () => {
    expect(weekStart("en-US")).toBe("sun");
    expect(weekStart("en-GB")).toBe("mon");
    expect(weekStart("!!")).toBe("mon");
  });
});

describe("ranges", () => {
  test("shift clamps to the month's end", () => {
    expect(shift("2026-01-31", { months: 1 })).toBe("2026-02-28");
  });

  test("last(n) spans n days ending on from", () => {
    expect(last(7, "2026-11-15")).toEqual({ start: "2026-11-09", end: "2026-11-15" });
    expect(valid(last(30))).toBe(true);
  });

  test("valid rejects reversed, malformed and over-long ranges", () => {
    expect(valid({ start: "2026-07-13", end: "2026-07-01" })).toBe(false);
    expect(valid({ start: "nope", end: "2026-07-01" })).toBe(false);
    expect(valid({ start: "2024-01-01", end: "2026-01-01" })).toBe(false);
    expect(valid({ start: "2026-01-01", end: "2026-01-10" }, 7)).toBe(false);
  });
});
