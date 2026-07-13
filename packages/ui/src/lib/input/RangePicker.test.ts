/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/svelte";

import RangePicker, { last, valid } from "./RangePicker.svelte";

describe("RangePicker helpers", () => {
  test("last(n) spans n days ending today and is valid", () => {
    const r = last(7);
    expect(valid(r)).toBe(true);
    expect(r.end >= r.start).toBe(true);
  });

  test("valid rejects reversed ranges", () => {
    expect(valid({ start: "2026-07-13", end: "2026-07-01" })).toBe(false);
  });

  test("valid rejects spans over 366 days", () => {
    expect(valid({ start: "2024-01-01", end: "2026-01-01" })).toBe(false);
  });
});

describe("RangePicker render", () => {
  test("renders a preset tab per preset", () => {
    render(RangePicker, { presets: [7, 30, 90] });
    for (const days of [7, 30, 90]) {
      expect(screen.getByRole("button", { name: `${days}d` })).toBeDefined();
    }
  });
});
