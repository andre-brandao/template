/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/svelte";

import RangePicker from "./RangePicker.svelte";

describe("RangePicker render", () => {
  test("renders a period trigger and the configured presets", () => {
    render(RangePicker, { presets: [7, 30, 90] });
    const presets = within(screen.getByRole("navigation", { name: "Preset periods" }));
    for (const days of [7, 30, 90]) {
      expect(presets.getByRole("button", { name: new RegExp(`Last ${days} days`) })).toBeDefined();
    }
    expect(screen.getByRole("button", { name: "Last 30 days" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Apply" })).toBeDefined();
  });

  test("keeps preset changes in a draft until Apply", async () => {
    let picked: { start: string; end: string } | undefined;
    render(RangePicker, {
      range: { start: "2026-10-18", end: "2026-11-16" },
      max: "2026-11-16",
      presets: [7, 30],
      onchange: (range) => (picked = range),
    });

    const presets = within(screen.getByRole("navigation", { name: "Preset periods" }));
    await fireEvent.click(presets.getByRole("button", { name: /Last 7 days/ }));
    expect(picked).toBeUndefined();

    await fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(picked).toEqual({ start: "2026-11-10", end: "2026-11-16" });
  });
});
