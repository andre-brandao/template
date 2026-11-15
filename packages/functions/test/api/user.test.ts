import { describe, expect } from "bun:test";
import { Todo } from "@template/core/todo";
import { createUser, setupApiTest } from "./util";

const { test, validateOpenAPIRoute, userID } = setupApiTest();

describe("user", () => {
  test("GET /me", async () => {
    const response = await validateOpenAPIRoute("get", "/me");
    expect(response.id).toBe(userID());
  });

  test("GET /user", async () => {
    const name = `Directory ${crypto.randomUUID()}`;
    const user = await createUser({ name, email: `${crypto.randomUUID()}@example.com` });
    const response = await validateOpenAPIRoute("get", "/user", { search: name });
    expect(response.map((row: { id: string }) => row.id)).toEqual([user.id]);
  });

  test("GET /user/:id", async () => {
    const mate = await createUser({
      name: "Mate",
      email: `mate-${crypto.randomUUID()}@example.com`,
    });
    const response = await validateOpenAPIRoute("get", "/user/:id", { id: mate.id });
    expect(response.name).toBe("Mate");
    expect(response.prefs).toBeUndefined();
  });

  test("GET /user/:id/history", async () => {
    await Todo.create({ title: "Mine" });
    const response = await validateOpenAPIRoute("get", "/user/:id/history", { id: userID() });
    expect(response.map((e: { type: string }) => e.type)).toContain("todo.created");
  });
});
