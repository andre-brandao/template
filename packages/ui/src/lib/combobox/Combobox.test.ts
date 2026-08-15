/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/svelte";
import { tick } from "svelte";

import Fixture from "./Fixture.test.svelte";

const items = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
  { id: "c", name: "Gamma" },
];

const open = async (container: HTMLElement) => {
  container.querySelector<HTMLButtonElement>('[role="combobox"]')!.click();
  await tick();
};

const options = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('[role="option"]'),
];

const type = async (container: HTMLElement, text: string) => {
  const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await tick();
};

describe("Combobox", () => {
  test("keeps the list unmounted until the trigger opens it", async () => {
    const { container } = render(Fixture, { items });
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    await open(container);
    expect(options(container)).toHaveLength(3);
  });

  test("the query filters items down to their label", async () => {
    const { container } = render(Fixture, { items });
    await open(container);
    await type(container, "amm");
    expect(options(container).map((one) => one.textContent)).toEqual(["Gamma"]);
  });

  test("Empty shows only once nothing survives the query", async () => {
    const { container } = render(Fixture, { items });
    await open(container);
    expect(container.textContent).not.toContain("Nothing matches.");
    await type(container, "zzz");
    expect(options(container)).toHaveLength(0);
    expect(container.textContent).toContain("Nothing matches.");
  });

  test("picking an item marks it selected and closes the list", async () => {
    const { container } = render(Fixture, { items });
    await open(container);
    options(container)[1].click();
    await tick();
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    await open(container);
    expect(options(container)[1].getAttribute("aria-selected")).toBe("true");
  });

  test("reopening starts from an empty query", async () => {
    const { container } = render(Fixture, { items });
    await open(container);
    await type(container, "alp");
    expect(options(container)).toHaveLength(1);
    options(container)[0].click();
    await tick();
    await open(container);
    expect(options(container)).toHaveLength(3);
  });

  test("Escape closes the list", async () => {
    const { container } = render(Fixture, { items });
    await open(container);
    container
      .querySelector(".combobox")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await tick();
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });

  test("the trigger reports the open state", async () => {
    const { container } = render(Fixture, { items });
    const trigger = container.querySelector('[role="combobox"]')!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await open(container);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });
});
