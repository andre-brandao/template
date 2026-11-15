import { describe, expect } from "bun:test";
import { createUser, setupApiTest } from "./util";

const { test, validateOpenAPIRoute, userID } = setupApiTest();

describe("user", () => {
  test("GET /me", async () => {
    const response = await validateOpenAPIRoute("get", "/me");
    expect(response.id).toBe(userID());
  });

  test("GET /user", async () => {
    const name = `Directory ${crypto.randomUUID()}`;
    const { id } = await createUser({ name, email: `${crypto.randomUUID()}@example.com` });
    const response = await validateOpenAPIRoute("get", "/user", { search: name });
    expect(response.map((user: { id: string }) => user.id)).toEqual([id]);
  });
});
