/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/svelte";

import DateSpanPicker, { type Span } from "./DateSpanPicker.svelte";

describe("DateSpanPicker", () => {
  test("commits both dates together through Apply", async () => {
    let picked: Span | undefined;
    const view = render(DateSpanPicker, {
      startName: "startDate",
      finishName: "dueDate",
      onchange: (span) => (picked = span),
    });

    await fireEvent.change(screen.getByLabelText("Start"), {
      target: { value: "2026-11-10" },
    });
    await fireEvent.change(screen.getByLabelText("Finish"), {
      target: { value: "2026-11-16" },
    });
    expect(picked).toBeUndefined();

    await fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(picked).toEqual({ start: "2026-11-10", finish: "2026-11-16" });
    expect(view.container.querySelector<HTMLInputElement>('[name="startDate"]')?.value).toBe(
      "2026-11-10",
    );
    expect(view.container.querySelector<HTMLInputElement>('[name="dueDate"]')?.value).toBe(
      "2026-11-16",
    );
  });
});
