/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/svelte";

import Skeleton from "./Skeleton.svelte";

describe("Skeleton", () => {
  test("takes the height it is given", () => {
    const { container } = render(Skeleton, { h: "2em" });
    expect(container.querySelector<HTMLElement>(".skeleton")?.style.height).toBe("2em");
  });

  test("width is optional — it fills its row without one", () => {
    const { container } = render(Skeleton, { h: "2em" });
    expect(container.querySelector<HTMLElement>(".skeleton")?.style.width).toBe("");
  });

  test("round marks the avatar-shaped slots", () => {
    const { container } = render(Skeleton, { h: "2em", w: "2em", round: true });
    const el = container.querySelector<HTMLElement>(".skeleton")!;
    expect(el.classList.contains("round")).toBe(true);
    expect(el.style.width).toBe("2em");
  });
});
