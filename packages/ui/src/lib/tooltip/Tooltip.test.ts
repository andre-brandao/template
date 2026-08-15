/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";

import Tooltip from "./Tooltip.svelte";

const children = createRawSnippet(() => ({ render: () => `<button>Save</button>` }));

describe("Tooltip", () => {
  test("renders the tip alongside the control it describes", () => {
    const { container } = render(Tooltip, { tip: "Writes the draft", children });
    expect(container.querySelector('[role="tooltip"]')?.textContent).toBe("Writes the draft");
    expect(container.querySelector("button")?.textContent).toBe("Save");
  });

  test("describes the first element rendered inside it", () => {
    const { container } = render(Tooltip, { tip: "Writes the draft", children });
    const tip = container.querySelector('[role="tooltip"]')!;
    expect(container.querySelector("button")?.getAttribute("aria-describedby")).toBe(tip.id);
  });

  test("side is carried on the bubble, which is positioned when shown", () => {
    const { container } = render(Tooltip, { tip: "Writes the draft", side: "right", children });
    expect(container.querySelector('[role="tooltip"]')?.getAttribute("data-side")).toBe("right");
  });
});
