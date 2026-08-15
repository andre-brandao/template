/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";

import Empty from "./Empty.svelte";

const children = createRawSnippet(() => ({ render: () => `<span>No tasks match this filter</span>` }));

describe("Empty", () => {
  test("renders the message", () => {
    const { container } = render(Empty, { children });
    expect(container.querySelector("p")?.textContent).toContain("No tasks match this filter");
  });

  test("stays a note in the flow without an action", () => {
    const { container } = render(Empty, { children });
    expect(container.querySelector(".empty")?.classList.contains("offers")).toBe(false);
  });

  test("an action turns it into a place on the page", () => {
    const { container } = render(Empty, {
      children,
      action: createRawSnippet(() => ({ render: () => `<button>New project</button>` })),
    });
    expect(container.querySelector(".empty")?.classList.contains("offers")).toBe(true);
    expect(container.querySelector("button")?.textContent).toBe("New project");
  });
});
