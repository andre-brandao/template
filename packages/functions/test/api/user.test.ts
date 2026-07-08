import { describe, expect } from "bun:test";
import { setupApiTest } from "./util";

const { test, validateOpenAPIRoute, userID } = setupApiTest();

describe("user", () => {
  test("GET /me", async () => {
    const response = await validateOpenAPIRoute("get", "/me");
    expect(response.id).toBe(userID());
  });
});
