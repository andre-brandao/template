import { describe, expect, it } from "bun:test";
import { issue } from "../src/lib/features/todos/github";
import { label } from "../src/lib/utils/link";
import { repos } from "../src/lib/features/projects/github";

describe("issue", () => {
  it("derives the badge from github.com/issue", () => {
    expect(issue({ "github.com/issue": "acme/api#12" })).toEqual({
      label: "acme/api#12",
      url: "https://github.com/acme/api/issues/12",
    });
  });

  it("skips missing or malformed values", () => {
    expect(issue({})).toBeUndefined();
    expect(issue({ "github.com/issue": "acme#12" })).toBeUndefined();
  });
});

describe("label", () => {
  it("prefers the title, then the host", () => {
    expect(label({ url: "https://docs.example.com/a", title: "Spec" })).toBe("Spec");
    expect(label({ url: "https://docs.example.com/a" })).toBe("docs.example.com");
  });
});

describe("repos", () => {
  it("splits github.com/repos into links", () => {
    expect(repos({ "github.com/repos": "acme/a, acme/b," })).toEqual([
      { name: "acme/a", url: "https://github.com/acme/a" },
      { name: "acme/b", url: "https://github.com/acme/b" },
    ]);
    expect(repos({})).toEqual([]);
  });
});
