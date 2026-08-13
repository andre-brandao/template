import { describe, expect, it, mock } from "bun:test";
import { methods, output, params, sdk } from "../src/api";
import { strip, value } from "../src/args";

describe("methods", () => {
  it("reflects SDK methods off the prototype", () => {
    const names = methods();
    expect(names).toContain("getMe");
    expect(names).toContain("getTodo");
    expect(names).toContain("postTodo");
    expect(names).not.toContain("constructor");
  });

  it("returns sorted, non-empty names", () => {
    const names = methods();
    expect(names.length).toBeGreaterThan(0);
    expect(names).toEqual([...names].sort());
  });
});

describe("sdk", () => {
  // `client` is protected on TemplateSdk; reaching it is the only way to assert plumbing.
  const cfg = (token?: string, url?: string) =>
    (sdk(token, url) as any).client.getConfig() as { baseUrl?: string; headers?: unknown };

  it("defaults to localhost:3000 with no auth header", () => {
    const c = cfg();
    expect(c.baseUrl).toBe("http://localhost:3000");
    expect(new Headers(c.headers as HeadersInit).get("authorization")).toBeNull();
  });

  it("sets the base url and bearer header", () => {
    const c = cfg("sk-1", "http://api");
    expect(c.baseUrl).toBe("http://api");
    expect(new Headers(c.headers as HeadersInit).get("authorization")).toBe("Bearer sk-1");
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

  it("only treats the first arg as a blob", () => {
    expect(params(["--title", '{"a":1}'])).toEqual({ title: '{"a":1}' });
  });

  it("keeps numeric-looking strings that are not numbers as strings", () => {
    expect(params(["--id", "todo_01ABC"])).toEqual({ id: "todo_01ABC" });
  });

  it("parses the --key=value form", () => {
    expect(params(["--title=hi", "--page=2"])).toEqual({ title: "hi", page: 2 });
  });

  it("splits --key=value on the first = only", () => {
    expect(params(["--title=a=b"])).toEqual({ title: "a=b" });
  });

  it("keeps an empty --key= as a string", () => {
    expect(params(["--title="])).toEqual({ title: "" });
  });

  it("coerces booleans and signed or fractional numbers", () => {
    expect(params(["--a", "true", "--b", "false", "--c", "-1.5", "--d", "0"])).toEqual({
      a: true,
      b: false,
      c: -1.5,
      d: 0,
    });
  });

  it("treats back-to-back and trailing flags as true", () => {
    expect(params(["--a", "--b"])).toEqual({ a: true, b: true });
  });

  it("ignores args that are not flags", () => {
    expect(params(["stray", "--title", "hi"])).toEqual({ title: "hi" });
  });

  it("lets the last occurrence of a flag win", () => {
    expect(params(["--title", "one", "--title", "two"])).toEqual({ title: "two" });
  });

  it("is empty for no args", () => {
    expect(params([])).toEqual({});
  });
});

describe("args", () => {
  it("reads a flag value and strips the pair", () => {
    const raw = ["--token", "abc", "--title", "hi"];
    expect(value(raw, "--token")).toBe("abc");
    expect(strip(raw, ["--token"])).toEqual(["--title", "hi"]);
  });

  it("returns undefined for a missing or trailing flag", () => {
    expect(value(["--title", "hi"], "--token")).toBeUndefined();
    expect(value(["--title", "hi", "--token"], "--token")).toBeUndefined();
  });

  it("reads the first occurrence of a repeated flag", () => {
    expect(value(["--token", "a", "--token", "b"], "--token")).toBe("a");
  });

  it("strips several flags at once and keeps the rest", () => {
    const raw = ["--token", "abc", "--title", "hi", "--url", "http://x", "--done"];
    expect(strip(raw, ["--token", "--url"])).toEqual(["--title", "hi", "--done"]);
  });

  it("strips a trailing flag that has no value", () => {
    expect(strip(["--title", "hi", "--token"], ["--token"])).toEqual(["--title", "hi"]);
  });

  it("leaves the list alone when nothing matches", () => {
    expect(strip(["--title", "hi"], ["--token"])).toEqual(["--title", "hi"]);
  });
});

describe("output", () => {
  it("prints data as indented JSON", () => {
    const log = console.log;
    const spy = mock();
    console.log = spy;
    output({ data: { id: "todo_1", done: false } });
    console.log = log;
    expect(spy).toHaveBeenCalledWith(JSON.stringify({ id: "todo_1", done: false }, null, 2));
  });
});
