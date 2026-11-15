import { describe, expect, test } from "bun:test";
import { Identity } from "../src/identity";
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
    Identity.provide("public", {}, () => {
      expect(Identity.can({ project: ["read"] })).toBe(false);
      expect(() => Identity.check({ project: ["read"] })).toThrow(VisibleError);
    });
  });

  test("system bypasses every check", () => {
    Identity.provide("system", {}, () => {
      expect(Identity.can({ user: ["delete"] })).toBe(true);
    });
  });

  test("the owner argument unlocks :own", () => {
    Identity.provide("user", { userID: "usr_1", role: "member" }, () => {
      expect(Identity.can({ key: ["delete"] }, "usr_2")).toBe(false);
      expect(Identity.can({ key: ["delete"] }, "usr_1")).toBe(true);
    });
  });

  test("a denial names what it needed", () => {
    Identity.provide("user", { userID: "usr_1", role: "member" }, () => {
      expect(() => Identity.check({ user: ["delete"] })).toThrow(/user:delete/);
    });
  });

  test("an agent holds its user's role, narrowed to its scope", () => {
    const scope = { todo: ["read"] } as const;
    Identity.provide("agent", { name: "claude", userID: "usr_1", role: "admin", scope }, () => {
      expect(Identity.can({ todo: ["read"] })).toBe(true);
      expect(Identity.can({ todo: ["delete"] })).toBe(false);
      expect(Identity.userID()).toBe("usr_1");
    });
    Identity.provide("agent", { name: "copilot", userID: "usr_1", role: "member" }, () => {
      expect(Identity.can({ todo: ["delete"] })).toBe(true);
      expect(Identity.can({ user: ["delete"] })).toBe(false);
      expect(new VisibleError("forbidden", "x", "y").statusCode()).toBe(403);
    });
  });
});
