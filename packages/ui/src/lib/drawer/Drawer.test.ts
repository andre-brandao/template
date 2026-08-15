/// <reference lib="dom" />

import { describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";

import Drawer from "./Drawer.svelte";

describe("Drawer", () => {
  test("renders children inside the dialog while open", () => {
    const { container } = render(Drawer, {
      open: true,
      children: createRawSnippet(() => ({ render: () => `<p>Body</p>` })),
    });
    const dialog = container.querySelector("dialog");
    expect(dialog?.textContent).toContain("Body");
  });

  test("does not mount children while closed", () => {
    const { container } = render(Drawer, {
      children: createRawSnippet(() => ({ render: () => `<p>Body</p>` })),
    });
    const dialog = container.querySelector("dialog");
    expect(dialog?.textContent).not.toContain("Body");
  });

  test("open opens the dialog as a modal", () => {
    const { container } = render(Drawer, {
      open: true,
      children: createRawSnippet(() => ({ render: () => `<p>Body</p>` })),
    });
    const dialog = container.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);
  });

  test("defaults to closed", () => {
    const { container } = render(Drawer, {
      children: createRawSnippet(() => ({ render: () => `<p>Body</p>` })),
    });
    const dialog = container.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(false);
  });

  test("onclose fires when the dialog closes itself", () => {
    const onclose = mock(() => {});
    const { container } = render(Drawer, {
      open: true,
      onclose,
      children: createRawSnippet(() => ({ render: () => `<p>Body</p>` })),
    });
    (container.querySelector("dialog") as HTMLDialogElement).close();
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  test("onclose also fires when the parent drives open to false", async () => {
    const onclose = mock(() => {});
    const { container, rerender } = render(Drawer, {
      open: true,
      onclose,
      children: createRawSnippet(() => ({ render: () => `<p>Body</p>` })),
    });
    await rerender({ open: false });
    expect((container.querySelector("dialog") as HTMLDialogElement).open).toBe(false);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  test("side sets the class used for left/right positioning", () => {
    const { container } = render(Drawer, {
      side: "left",
      children: createRawSnippet(() => ({ render: () => `<p>Body</p>` })),
    });
    expect(container.querySelector("dialog")?.classList.contains("left")).toBe(true);
  });

  test("side bottom sets the sheet class", () => {
    const { container } = render(Drawer, {
      side: "bottom",
      children: createRawSnippet(() => ({ render: () => `<p>Body</p>` })),
    });
    expect(container.querySelector("dialog")?.classList.contains("bottom")).toBe(true);
  });
});
