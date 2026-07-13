import { describe, expect, it } from "bun:test";
import { methods, params } from "../src/api";
import { strip, value } from "../src/args";

describe("methods", () => {
  it("reflects SDK methods off the prototype", () => {
    const names = methods();
    expect(names).toContain("getMe");
    expect(names).toContain("getTodo");
    expect(names).toContain("postTodo");
    expect(names).not.toContain("constructor");
  });
});

describe("params", () => {
  it("parses --key value flags with coercion", () => {
    expect(params(["--title", "hi", "--page", "2", "--done"])).toEqual({
      title: "hi",
      page: 2,
      done: true,
    });
  });

  it("parses a JSON blob", () => {
    expect(params(['{"title":"hi","page":3}'])).toEqual({ title: "hi", page: 3 });
  });

  it("keeps numeric-looking strings that are not numbers as strings", () => {
    expect(params(["--id", "todo_01ABC"])).toEqual({ id: "todo_01ABC" });
  });
});

describe("args", () => {
  it("reads a flag value and strips the pair", () => {
    const raw = ["--token", "abc", "--title", "hi"];
    expect(value(raw, "--token")).toBe("abc");
    expect(strip(raw, ["--token"])).toEqual(["--title", "hi"]);
  });
});
