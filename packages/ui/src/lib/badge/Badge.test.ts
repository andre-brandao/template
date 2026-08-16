/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";

import Badge from "./Badge.svelte";

const children = createRawSnippet(() => ({ render: () => `<span>done</span>` }));

describe("Badge", () => {
  test("renders its label", () => {
    const { container } = render(Badge, { children });
    expect(container.querySelector(".badge")?.textContent).toContain("done");
  });

  test("tone picks the class the tokens hang off", () => {
    const { container } = render(Badge, { tone: "danger", children });
    expect(container.querySelector(".badge")?.classList.contains("danger")).toBe(true);
  });

  test("defaults to the muted tone", () => {
    const { container } = render(Badge, { children });
    expect(container.querySelector(".badge")?.classList.contains("muted")).toBe(true);
  });
});
