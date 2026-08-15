/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/svelte";

import Avatar from "./Avatar.svelte";

describe("Avatar", () => {
  test("shows the image when there is one", () => {
    const { container } = render(Avatar, { name: "Ada Lovelace", image: "/ada.png" });
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/ada.png");
    expect(container.querySelector(".fallback")).toBeNull();
  });

  test("falls back to the first letter of the name", () => {
    const { container } = render(Avatar, { name: "ada lovelace" });
    expect(container.querySelector(".fallback")?.textContent).toBe("A");
  });

  test("a nameless avatar still fills its slot", () => {
    const { container } = render(Avatar, { name: "   " });
    expect(container.querySelector(".fallback")?.textContent).toBe("?");
  });

  test("size drives the box", () => {
    const { container } = render(Avatar, { name: "Ada", size: 48 });
    expect(container.querySelector<HTMLElement>(".fallback")?.getAttribute("style")).toContain(
      "--size: 48px",
    );
  });
});
