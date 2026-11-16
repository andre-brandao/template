import { describe, expect, test } from "bun:test";

import { preset, resolve, trailing } from "./preset";

const ctx = { end: "2026-11-16", weekStart: "mon" as const };

describe("period presets", () => {
  test("resolve relative ranges against the supplied end", () => {
    expect(resolve(preset.today, ctx).range).toEqual({ start: "2026-11-16", end: "2026-11-16" });
    expect(resolve(preset.yesterday, ctx).range).toEqual({
      start: "2026-11-15",
      end: "2026-11-15",
    });
    expect(resolve(trailing(7), ctx).range).toEqual({ start: "2026-11-10", end: "2026-11-16" });
  });

  test("resolve calendar-to-date ranges", () => {
    expect(resolve(preset.week, ctx).range).toEqual({ start: "2026-11-16", end: "2026-11-16" });
    expect(resolve(preset.month, ctx).range).toEqual({ start: "2026-11-01", end: "2026-11-16" });
    expect(resolve(preset.year, ctx).range).toEqual({ start: "2026-01-01", end: "2026-11-16" });
  });
});
