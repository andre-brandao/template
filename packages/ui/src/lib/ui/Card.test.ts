/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";

import Card from "./Card.svelte";

describe("Card", () => {
  test("renders children inside the card container", () => {
    const { container } = render(Card, {
      children: createRawSnippet(() => ({ render: () => `<p>Body</p>` })),
    });
    const card = container.querySelector(".card");
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain("Body");
  });
});
