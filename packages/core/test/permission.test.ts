import { describe, expect, test } from "bun:test";
import { Actor } from "../src/actor";
import { Permission } from "../src/permission";
import { VisibleError } from "../src/error";

describe("permission", () => {
  test("a role holds only what it lists", () => {
    expect(Permission.can("admin", { user: ["delete"] })).toBe(true);
    expect(Permission.can("member", { user: ["delete"] })).toBe(false);
  });

  test("every listed action must be held", () => {
    expect(Permission.can("member", { project: ["update", "delete"] })).toBe(true);
    expect(Permission.can("member", { project: ["update"], user: ["delete"] })).toBe(false);
  });

  test("an empty ask is trivially allowed", () => {
    expect(Permission.can("member", {})).toBe(true);
  });

  test(":own grants need ownership", () => {
    expect(Permission.can("member", { key: ["delete"] })).toBe(false);
    expect(Permission.can("member", { key: ["delete"] }, true)).toBe(true);
    // admin holds the unsuffixed grant, so ownership is irrelevant
    expect(Permission.can("admin", { key: ["delete"] })).toBe(true);
  });

  test("ownership does not invent grants", () => {
    expect(Permission.can("member", { user: ["delete"] }, true)).toBe(false);
  });

  test("no role holds nothing", () => {
    expect(Permission.can(undefined, { project: ["read"] })).toBe(false);
  });
});

describe("actor", () => {
  test("public is denied everything", () => {
    Actor.provide("public", {}, () => {
      expect(Actor.can({ project: ["read"] })).toBe(false);
      expect(() => Actor.check({ project: ["read"] })).toThrow(VisibleError);
    });
  });

  test("system bypasses every check", () => {
    Actor.provide("system", {}, () => {
      expect(Actor.can({ user: ["delete"] })).toBe(true);
    });
  });

  test("the owner argument unlocks :own", () => {
    Actor.provide("user", { userID: "usr_1", role: "member" }, () => {
      expect(Actor.can({ key: ["delete"] }, "usr_2")).toBe(false);
      expect(Actor.can({ key: ["delete"] }, "usr_1")).toBe(true);
    });
  });

  test("a denial names what it needed", () => {
    Actor.provide("user", { userID: "usr_1", role: "member" }, () => {
      expect(() => Actor.check({ user: ["delete"] })).toThrow(/user:delete/);
      expect(new VisibleError("forbidden", "x", "y").statusCode()).toBe(403);
    });
  });
});
