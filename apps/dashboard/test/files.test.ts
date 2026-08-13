import { describe, expect, it } from "bun:test";
import { Actor } from "@template/core/actor";
import { key } from "../src/lib/server/files";

const as = <T>(fn: () => T) => Actor.provide("user", { userID: "usr_01ABC", role: "member" }, fn);

describe("key", () => {
  it("prefixes the storage key with the acting user", () => {
    expect(as(() => key("report.pdf"))).toBe("usr_01ABC/report.pdf");
  });

  // The prefix is the only ownership check there is, so a name that escapes it is a breach.
  it("flattens paths to a basename so a name cannot walk out of the prefix", () => {
    expect(as(() => key("../../etc/passwd"))).toBe("usr_01ABC/passwd");
    expect(as(() => key("nested/dir/report.pdf"))).toBe("usr_01ABC/report.pdf");
    expect(as(() => key("C:\\Users\\me\\report.pdf"))).toBe("usr_01ABC/report.pdf");
  });

  it("trims surrounding whitespace", () => {
    expect(as(() => key("  report.pdf  "))).toBe("usr_01ABC/report.pdf");
  });

  it("rejects names with no usable basename", () => {
    for (const name of ["", "   ", "/", "..", ".", "foo/", "foo/.."]) {
      expect(() => as(() => key(name))).toThrow();
    }
  });
});
