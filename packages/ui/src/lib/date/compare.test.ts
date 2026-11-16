import { describe, expect, test } from "bun:test";

import { comparison } from "./compare";

const range = { start: "2026-10-18", end: "2026-11-16" };

describe("comparison", () => {
  test("resolves previous and weekday-aligned periods", () => {
    expect(comparison(range, "previous").range).toEqual({
      start: "2026-09-18",
      end: "2026-10-17",
    });
    expect(comparison(range, "weekdays").range).toEqual({
      start: "2026-09-20",
      end: "2026-10-19",
    });
  });

  test("resolves last year and a valid custom range", () => {
    expect(comparison(range, "year").range).toEqual({
      start: "2025-10-18",
      end: "2025-11-16",
    });
    expect(comparison(range, "custom", { start: "2026-01-01", end: "2026-01-31" }).range).toEqual({
      start: "2026-01-01",
      end: "2026-01-31",
    });
  });
});
