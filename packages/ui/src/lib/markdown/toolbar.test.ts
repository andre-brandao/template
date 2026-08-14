import { describe, expect, test } from "bun:test";

import { fence, link, prefix, wrap } from "./toolbar";

const apply = (value: string, edit: { text: string; from: number; to: number }) =>
  value.slice(0, edit.from) + edit.text + value.slice(edit.to);

describe("wrap", () => {
  test("wraps the selection and keeps it selected", () => {
    const edit = wrap("hello world", 6, 11, "**");
    expect(apply("hello world", edit)).toBe("hello **world**");
    expect(edit.start).toBe(8);
    expect(edit.end).toBe(13);
  });

  test("unwraps when the marker is already there", () => {
    const edit = wrap("hello **world**", 8, 13, "**");
    expect(apply("hello **world**", edit)).toBe("hello world");
    expect(edit.start).toBe(6);
    expect(edit.end).toBe(11);
  });

  test("with no selection leaves the caret between the markers", () => {
    const edit = wrap("ab", 1, 1, "`");
    expect(apply("ab", edit)).toBe("a``b");
    expect(edit.start).toBe(2);
    expect(edit.end).toBe(2);
  });
});

describe("prefix", () => {
  test("marks every line the selection touches", () => {
    const value = "one\ntwo\nthree";
    const edit = prefix(value, 5, 9, "- ");
    expect(apply(value, edit)).toBe("one\n- two\n- three");
  });

  test("expands to the start of a partially selected line", () => {
    const value = "one\ntwo";
    const edit = prefix(value, 6, 6, "> ");
    expect(apply(value, edit)).toBe("one\n> two");
  });

  test("toggles off when every line already has the marker", () => {
    const value = "- one\n- two";
    const edit = prefix(value, 0, value.length, "- ");
    expect(apply(value, edit)).toBe("one\ntwo");
  });

  test("toggles on when only some lines have the marker", () => {
    const value = "- one\ntwo";
    const edit = prefix(value, 0, value.length, "- ");
    expect(apply(value, edit)).toBe("- - one\n- two");
  });
});

describe("link", () => {
  test("keeps the selection as the label and selects the href", () => {
    const value = "see docs";
    const edit = link(value, 4, 8);
    const next = apply(value, edit);
    expect(next).toBe("see [docs](url)");
    expect(next.slice(edit.start, edit.end)).toBe("url");
  });

  test("falls back to a placeholder label", () => {
    const edit = link("", 0, 0);
    expect(apply("", edit)).toBe("[text](url)");
  });
});

describe("fence", () => {
  test("fences the selection and parks the caret on the language slot", () => {
    const value = "const a = 1";
    const edit = fence(value, 0, value.length);
    expect(apply(value, edit)).toBe("```\nconst a = 1\n```");
    expect(edit.start).toBe(3);
  });
});
