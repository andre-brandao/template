/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/svelte";

import RangeCompare from "./RangeCompare.svelte";
import type { Comparison } from "./compare";

describe("RangeCompare", () => {
  test("emits a resolved comparison without changing the primary range", async () => {
    let picked: Comparison | undefined;
    const range = { start: "2026-10-18", end: "2026-11-16" };
    render(RangeCompare, { range, onchange: (value) => (picked = value) });

    await fireEvent.change(screen.getByLabelText("Comparison"), {
      target: { value: "previous" },
    });

    expect(picked).toEqual({
      mode: "previous",
      range: { start: "2026-09-18", end: "2026-10-17" },
    });
    expect(range).toEqual({ start: "2026-10-18", end: "2026-11-16" });
  });
});
