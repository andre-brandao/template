/// <reference lib="dom" />

import { beforeEach, describe, expect, test } from "bun:test";
import { fireEvent, render } from "@testing-library/svelte";

import Toaster from "./Toaster.svelte";
import { queue, toast } from "./toast.svelte";

beforeEach(() => {
  queue.items.splice(0);
});

describe("Toaster", () => {
  test("renders one entry per queued toast, newest last", () => {
    toast("first");
    toast("second");
    const { container } = render(Toaster);
    const list = container.querySelectorAll("li");
    expect(list).toHaveLength(2);
    expect(list[1].textContent).toContain("second");
  });

  test("tags each entry with its kind", () => {
    toast.success("ok");
    toast.error("no");
    const { container } = render(Toaster);
    const list = container.querySelectorAll("li");
    expect(list[0].classList.contains("success")).toBe(true);
    expect(list[1].classList.contains("error")).toBe(true);
  });

  test("errors are announced assertively", () => {
    toast.error("no");
    const { container } = render(Toaster);
    expect(container.querySelector("li")?.getAttribute("role")).toBe("alert");
  });

  test("a loading toast carries a spinner", () => {
    toast.loading("Uploading");
    const { container } = render(Toaster);
    expect(container.querySelector("li .spinner")).not.toBeNull();
  });

  test("the dismiss button sends the toast out", async () => {
    toast("Saved");
    const { container } = render(Toaster);
    await fireEvent.click(container.querySelector("li .x") as HTMLButtonElement);
    expect(container.querySelector("li")?.hasAttribute("data-gone")).toBe(true);
  });

  test("the action runs and dismisses the toast", async () => {
    let undone = 0;
    toast("Deleted", { action: { label: "Undo", onclick: () => undone++ } });
    const { container } = render(Toaster);
    const action = container.querySelector("li button.ghost") as HTMLButtonElement;
    expect(action.textContent).toContain("Undo");
    await fireEvent.click(action);
    expect(undone).toBe(1);
    expect(container.querySelector("li")?.hasAttribute("data-gone")).toBe(true);
  });

  test("pointing at the stack expands it and freezes the countdown", async () => {
    toast("Saved", { duration: 40 });
    const { container } = render(Toaster);
    const list = container.querySelector("ol") as HTMLOListElement;
    await fireEvent.pointerEnter(list);
    expect(list.hasAttribute("data-open")).toBe(true);
    await Bun.sleep(80);
    expect(queue.items[0].gone).toBe(false);
    await fireEvent.pointerLeave(list);
    expect(list.hasAttribute("data-open")).toBe(false);
    await Bun.sleep(80);
    expect(queue.items[0].gone).toBe(true);
  });
});
