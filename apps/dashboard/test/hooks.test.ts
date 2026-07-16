import { describe, it, expect } from "bun:test";
import { handleError } from "../src/hooks.server";
import { VisibleError } from "@template/core/error";

const event = { url: new URL("http://localhost/todos") };
const call = (status: number, error: unknown, message = "boom") =>
  handleError({ error, event, status, message } as Parameters<typeof handleError>[0]);

describe("handleError", () => {
  it("returns a generic message for 404", () => {
    expect(call(404, new Error("missing"))).toEqual({ message: "Not found" });
  });

  it("surfaces a VisibleError message and code", () => {
    const err = new VisibleError("not_found", "todo_not_found", "Todo not found");
    expect(call(500, err)).toEqual({ message: "Todo not found", code: "todo_not_found" });
  });

  it("hides unexpected Error details in production", () => {
    expect(call(500, new Error("stack trace"))).toEqual({
      message: "An unexpected error occurred.",
    });
  });

  it("hides non-Error throws in production", () => {
    expect(call(500, "kaboom")).toEqual({ message: "An unexpected error occurred." });
  });
});
