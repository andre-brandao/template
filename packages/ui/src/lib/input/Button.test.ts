/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";

import Button from "./Button.svelte";

const label = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe("Button", () => {
  test("renders children and defaults to type=button", () => {
    render(Button, { children: label("Go") });
    const btn = screen.getByRole("button", { name: "Go" });
    expect(btn.getAttribute("type")).toBe("button");
  });

  test("applies the variant as a class", () => {
    render(Button, { variant: "danger", children: label("Delete") });
    expect(screen.getByRole("button", { name: "Delete" }).classList.contains("danger")).toBe(true);
  });

  test("pending disables the button and marks it busy", () => {
    render(Button, { pending: true, children: label("Save") });
    const btn = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  test("fires onclick when pressed", async () => {
    let clicks = 0;
    render(Button, { onclick: () => clicks++, children: label("Tap") });
    await fireEvent.click(screen.getByRole("button", { name: "Tap" }));
    expect(clicks).toBe(1);
  });
});
