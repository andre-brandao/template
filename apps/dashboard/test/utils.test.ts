import { describe, expect, it } from "bun:test";
import { debounce } from "../src/lib/utils/debounce";
import { size } from "../src/lib/utils/size";

describe("size", () => {
  it("keeps bytes under a kilobyte", () => {
    expect(size(0)).toBe("0 B");
    expect(size(1023)).toBe("1023 B");
  });

  it("steps up through KB, MB and GB at each 1024 boundary", () => {
    expect(size(1024)).toBe("1.0 KB");
    expect(size(1024 ** 2)).toBe("1.0 MB");
    expect(size(1024 ** 3)).toBe("1.0 GB");
    expect(size(1024 ** 4)).toBe("1024.0 GB");
  });

  it("rounds to one decimal", () => {
    expect(size(1536)).toBe("1.5 KB");
    expect(size(20 * 1024 * 1024)).toBe("20.0 MB");
  });
});

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("debounce", () => {
  it("runs once after the delay with the last arguments", async () => {
    const seen: string[] = [];
    const fn = debounce((v: string) => seen.push(v), 5);
    fn("a");
    fn("b");
    fn("c");
    expect(seen).toBeEmpty();
    await tick(20);
    expect(seen).toEqual(["c"]);
  });

  it("runs again for a call that lands after the delay", async () => {
    const seen: number[] = [];
    const fn = debounce((v: number) => seen.push(v), 5);
    fn(1);
    await tick(20);
    fn(2);
    await tick(20);
    expect(seen).toEqual([1, 2]);
  });
});
