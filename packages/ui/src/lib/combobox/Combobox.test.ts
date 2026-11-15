/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/svelte";
import { tick } from "svelte";

import Fixture from "./Fixture.test.svelte";

const items = [
  { id: "a", name: "gpt-6-luna", kind: "OpenAI" },
  { id: "b", name: "gpt-5.4-mini", kind: "OpenAI" },
  { id: "c", name: "claude-sonnet-4-5", kind: "Anthropic" },
];

const options = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const search = (el: HTMLElement) => el.querySelector<HTMLInputElement>('[role="combobox"]')!;

async function type(el: HTMLElement, text: string) {
  search(el).value = text;
  search(el).dispatchEvent(new Event("input", { bubbles: true }));
  await tick();
}

async function key(el: HTMLElement, name: string) {
  search(el).dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }));
  await tick();
}

describe("Combobox", () => {
  test("renders no rows until it opens", () => {
    const { container } = render(Fixture, { items });
    expect(options(container)).toHaveLength(0);
  });

  test("tokens match segment prefixes and the hit is marked", async () => {
    const { container } = render(Fixture, { items, open: true });
    await type(container, "g6 luna");
    expect(options(container).map((one) => one.textContent?.trim())).toEqual(["gpt-6-luna ✓"]);
    expect([...container.querySelectorAll("mark")].map((one) => one.textContent)).toEqual([
      "g",
      "6",
      "luna",
    ]);
  });

  test("facet chips count the query's matches and narrow the rows", async () => {
    const { container } = render(Fixture, { items, open: true });
    await type(container, "gpt");
    const chips = [...container.querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(chips.map((one) => one.textContent)).toEqual(["All2", "Anthropic0", "OpenAI2"]);
    chips[1].click();
    await tick();
    expect(options(container)).toHaveLength(0);
    expect(container.textContent).toContain("Nothing in Anthropic.");
  });

  test("arrows move the active descendant and Enter picks it", async () => {
    const { container } = render(Fixture, { items, open: true });
    expect(search(container).getAttribute("aria-activedescendant")).toBe(options(container)[0].id);
    await key(container, "End");
    expect(search(container).getAttribute("aria-activedescendant")).toBe(options(container)[2].id);
    await key(container, "ArrowDown");
    expect(search(container).getAttribute("aria-activedescendant")).toBe(options(container)[0].id);
    await key(container, "ArrowDown");
    await key(container, "Enter");
    expect(options(container)).toHaveLength(0);
    expect(container.querySelector(".trigger")?.textContent).toContain("gpt-5.4-mini");
  });
});
