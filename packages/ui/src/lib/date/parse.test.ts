import { describe, expect, test } from "bun:test";
import { parse } from "./parse";

// 2026-11-15 is a Sunday.
const us = { today: "2026-11-15", locale: "en-US" };
const gb = { today: "2026-11-15", locale: "en-GB" };

describe("parse", () => {
  test("words", () => {
    expect(parse("today", us)).toBe("2026-11-15");
    expect(parse("Tod", us)).toBe("2026-11-15");
    expect(parse("tomorrow", us)).toBe("2026-11-16");
    expect(parse("tmr", us)).toBe("2026-11-16");
    expect(parse("yesterday", us)).toBe("2026-11-14");
  });

  test("relative offsets", () => {
    expect(parse("+3d", us)).toBe("2026-11-18");
    expect(parse("-2w", us)).toBe("2026-11-01");
    expect(parse("+1m", us)).toBe("2026-12-15");
    expect(parse("+5", us)).toBe("2026-11-20");
    expect(parse("in 3 days", us)).toBe("2026-11-18");
    expect(parse("in 2 weeks", us)).toBe("2026-11-29");
  });

  test("weekdays", () => {
    expect(parse("fri", us)).toBe("2026-11-20");
    expect(parse("sunday", us)).toBe("2026-11-22");
    expect(parse("next fri", us)).toBe("2026-11-27");
    expect(parse("next mon", gb)).toBe("2026-11-16");
  });

  test("ends of week and month follow the locale", () => {
    expect(parse("eow", us)).toBe("2026-11-21");
    expect(parse("eow", gb)).toBe("2026-11-15");
    expect(parse("eom", us)).toBe("2026-11-30");
  });

  test("ISO and numeric in the locale's order", () => {
    expect(parse("2026-12-25", us)).toBe("2026-12-25");
    expect(parse("12/25/2026", us)).toBe("2026-12-25");
    expect(parse("25/12/2026", gb)).toBe("2026-12-25");
    expect(parse("3/4", us)).toBe("2026-03-04");
    expect(parse("3/4/27", gb)).toBe("2027-04-03");
  });

  test("rejects nonsense and impossible days", () => {
    expect(parse("", us)).toBeUndefined();
    expect(parse("someday", us)).toBeUndefined();
    expect(parse("2026-02-31", us)).toBeUndefined();
    expect(parse("13/13/2026", us)).toBeUndefined();
  });
});
