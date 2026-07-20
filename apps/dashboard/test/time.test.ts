import { describe, it, expect } from "bun:test";
import { ago } from "../src/lib/utils/time";

const before = (ms: number) => new Date(Date.now() - ms).toISOString();

describe("ago", () => {
  it("returns 'just now' for under a minute", () => {
    expect(ago(before(10_000))).toBe("just now");
  });

  it("returns minutes for under an hour", () => {
    expect(ago(before(5 * 60_000))).toBe("5m ago");
  });

  it("returns hours for under a day", () => {
    expect(ago(before(3 * 3_600_000))).toBe("3h ago");
  });

  it("returns days for under a month", () => {
    expect(ago(before(5 * 86_400_000))).toBe("5d ago");
  });

  it("returns a locale date for a month or older", () => {
    const iso = before(40 * 86_400_000);
    expect(ago(iso)).toBe(new Date(iso).toLocaleDateString());
  });
});
