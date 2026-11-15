import { describe, expect } from "bun:test";
import { setupApiTest, createUser } from "./util";
import { app } from "../../src/api/routes";
import { App } from "@template/core/app";
import { Key } from "@template/core/key";

const { test, validateOpenAPIRoute, get } = setupApiTest("admin");

describe("app", () => {
  test("GET /app", async () => {
    const made = await App.create({ name: "Listed" });
    const response = await validateOpenAPIRoute("get", "/app");
    expect(response).toContainEqual(made);
  });

  test("GET /app/:id", async () => {
    const made = await App.create({ name: "Billing" });
    const response = await validateOpenAPIRoute("get", "/app/:id", { id: made.id });
    expect(response.name).toBe("Billing");
  });

  test("POST /app", async () => {
    const response = await validateOpenAPIRoute("post", "/app", undefined, { name: "CI" });
    expect(response.name).toBe("CI");
    expect(response.inbound).toBe(false);
  });

  test("PATCH /app/:id", async () => {
    const made = await App.create({ name: "Old" });
    const response = await validateOpenAPIRoute(
      "patch",
      "/app/:id",
      { id: made.id },
      { name: "New" },
    );
    expect(response.name).toBe("New");
  });

  test("DELETE /app/:id", async () => {
    const made = await App.create({ name: "Gone" });
    await validateOpenAPIRoute("delete", "/app/:id", { id: made.id });
    expect(await App.fromID(made.id)).toBeNull();
  });

  test("GET /app/:id/key", async () => {
    const made = await App.create({ name: "Keyed" });
    await App.key({ app: made.id, name: "deploy" });
    const response = await validateOpenAPIRoute("get", "/app/:id/key", { id: made.id });
    expect(response).toHaveLength(1);
    expect(response[0].key).toBeNull();
  });

  test("POST /app/:id/key", async () => {
    const made = await App.create({ name: "Minted" });
    const response = await validateOpenAPIRoute(
      "post",
      "/app/:id/key",
      { id: made.id },
      { name: "deploy", expiresInDays: 30 },
    );
    expect(response.key).toStartWith("sk-");
    expect((await Key.verify(response.key!))?.userID).toBe(made.id);
  });

  test("DELETE /app/:id/key/:key", async () => {
    const made = await App.create({ name: "Revoked" });
    const key = await App.key({ app: made.id, name: "deploy" });
    await validateOpenAPIRoute("delete", "/app/:id/key/:key", { id: made.id, key: key.id });
    expect(await Key.verify(key.key)).toBeNull();
  });

  test("POST /app/:id/secret", async () => {
    const made = await App.create({ name: "Inbound" });
    const response = await validateOpenAPIRoute("post", "/app/:id/secret", { id: made.id });
    expect(response.secret).toStartWith("whsec_");
    expect((await App.fromID(made.id))?.inbound).toBe(true);
  });

  test("a member is refused with a 403", async () => {
    const member = await createUser({
      name: "Member",
      email: `m-${crypto.randomUUID()}@example.com`,
    });
    const key = await Key.create({ userID: member.id, name: "member" });
    const res = await app.request("/app", { headers: { authorization: `Bearer ${key.key}` } });
    expect(res.status).toBe(403);
    expect((await get("/app")).status).toBe(200);
  });
});
