/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/svelte";

import RangePicker from "./RangePicker.svelte";

describe("RangePicker render", () => {
  test("renders a preset tab per preset, then Custom", () => {
    render(RangePicker, { presets: [7, 30, 90] });
    for (const days of [7, 30, 90]) {
      expect(screen.getByRole("button", { name: `${days}d` })).toBeDefined();
    }
    expect(screen.getByRole("button", { name: "Custom" })).toBeDefined();
  });
});
