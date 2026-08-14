import { beforeEach, describe, expect, test } from "bun:test";

import { queue, toast } from "./toast.svelte";

/** Long enough to cover the exit delay the store schedules the real removal on. */
const EXIT = 300;

const find = (id: number) => queue.items.find((t) => t.id === id);

beforeEach(() => {
  queue.items.splice(0);
});

describe("toast", () => {
  test("queues an info toast by default and returns its id", () => {
    const id = toast("Saved");
    expect(queue.items).toHaveLength(1);
    expect(find(id)?.kind).toBe("info");
    expect(find(id)?.text).toBe("Saved");
  });

  test("each variant tags its own kind", () => {
    expect(find(toast.success("ok"))?.kind).toBe("success");
    expect(find(toast.error("no"))?.kind).toBe("error");
    expect(find(toast.loading("wait"))?.kind).toBe("loading");
  });

  test("keeps the action for the viewport to render", () => {
    const onclick = () => {};
    expect(find(toast("Deleted", { action: { label: "Undo", onclick } }))?.action).toEqual({
      label: "Undo",
      onclick,
    });
  });

  test("dismiss marks the toast gone, then drops it once its exit is over", async () => {
    const id = toast("Saved");
    toast.dismiss(id);
    expect(find(id)?.gone).toBe(true);
    await Bun.sleep(EXIT);
    expect(find(id)).toBeUndefined();
  });

  test("dismiss with no id clears everything", () => {
    toast("a");
    toast("b");
    toast.dismiss();
    expect(queue.items.every((t) => t.gone)).toBe(true);
  });

  test("a fourth toast evicts the oldest", () => {
    const first = toast("a");
    toast("b");
    toast("c");
    toast("d");
    expect(find(first)?.gone).toBe(true);
    expect(queue.items.filter((t) => !t.gone)).toHaveLength(3);
  });

  test("auto-dismisses once its duration is up", async () => {
    const id = toast("Saved", { duration: 30 });
    await Bun.sleep(60);
    expect(find(id)?.gone).toBe(true);
  });

  test("duration 0 stays put", async () => {
    const id = toast("Saved", { duration: 0 });
    await Bun.sleep(60);
    expect(find(id)?.gone).toBe(false);
  });

  test("loading never expires on its own", async () => {
    const id = toast.loading("Uploading");
    await Bun.sleep(60);
    expect(find(id)?.gone).toBe(false);
  });

  test("pause holds the countdown, resume spends what was left of it", async () => {
    const id = toast("Saved", { duration: 100 });
    await Bun.sleep(50);
    queue.pause();
    await Bun.sleep(200);
    expect(find(id)?.gone).toBe(false);
    queue.resume();
    await Bun.sleep(30);
    expect(find(id)?.gone).toBe(false);
    await Bun.sleep(60);
    expect(find(id)?.gone).toBe(true);
  });

  test("promise turns its loading toast into a success in place", async () => {
    await toast.promise(Promise.resolve("x"), {
      loading: "Uploading",
      success: "Uploaded",
      error: "Failed",
    });
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0].kind).toBe("success");
    expect(queue.items[0].text).toBe("Uploaded");
  });

  test("promise turns it into an error on rejection", async () => {
    await toast
      .promise(Promise.reject(new Error("boom")), {
        loading: "Uploading",
        success: "Uploaded",
        error: (e) => `Failed: ${(e as Error).message}`,
      })
      .catch(() => {});
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0].kind).toBe("error");
    expect(queue.items[0].text).toBe("Failed: boom");
  });

  test("promise resolves through to the caller and can name the value", async () => {
    const value = await toast.promise(Promise.resolve(7), {
      loading: "Counting",
      success: (n) => `Got ${n}`,
      error: "Failed",
    });
    expect(value).toBe(7);
    expect(queue.items[0].text).toBe("Got 7");
  });
});
