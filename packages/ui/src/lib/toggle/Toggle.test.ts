/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { fireEvent, render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";

import Toggle from "./Toggle.svelte";

const children = createRawSnippet(() => ({ render: () => `<span>Only mine</span>` }));

describe("Toggle", () => {
  test("flips aria-pressed and reports the new state", async () => {
    const seen: boolean[] = [];
    const { getByRole } = render(Toggle, { children, onclick: (on: boolean) => seen.push(on) });
    const chip = getByRole("button");
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    await fireEvent.click(chip);
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(seen).toEqual([true]);
  });

  test("renders a count badge", () => {
    const { container } = render(Toggle, { children, count: 4 });
    expect(container.querySelector(".n")?.textContent).toBe("4");
  });
});
