import { describe, expect } from "bun:test";
import { setupApiTest } from "./util";
import { app } from "../../src/api/routes";
import { Key } from "@template/core/key";

const { test, validateOpenAPIRoute, noAuth, get, userID } = setupApiTest();

describe("key", () => {
  test("GET /key", async () => {
    const response = await validateOpenAPIRoute("get", "/key");
    expect(response).toBeArray();
  });

  test("GET /key flags the key authenticating the request as current", async () => {
    const res = await get("/key");
    const keys = (await res.json()) as Key.Info[];

    const current = keys.find((key) => key.current);
    expect(current).toBeDefined();
    expect(current!.key).toStartWith("sk-");
    expect(current!.display).toStartWith("sk-");
  });

  test("revoking a key signs that token out", async () => {
    const other = await Key.create({ userID: userID(), name: "other" });
    expect(
      (await app.request("/me", { headers: { authorization: `Bearer ${other.key}` } })).status,
    ).toBe(200);

    await Key.remove(other.id);

    expect(
      (await app.request("/me", { headers: { authorization: `Bearer ${other.key}` } })).status,
    ).toBe(401);
  });

  test("POST /key", async () => {
    const response = await validateOpenAPIRoute("post", "/key", undefined, { name: "laptop" });
    expect(response.name).toBe("laptop");
    expect(response.key).toStartWith("sk-");
    expect((await Key.verify(response.key))?.userID).toBe(userID());
  });

  test("DELETE /key/:id", async () => {
    const key = await Key.create({ userID: userID(), name: "temporary" });
    await validateOpenAPIRoute("delete", "/key/:id", { id: key.id });
    expect(await Key.verify(key.key)).toBeNull();
  });

  // An API key authenticates the same actor through the same middleware, until revoked.
  test("an api key authenticates a request, until revoked", async () => {
    const key = await Key.create({ userID: userID(), name: "cli" });
    const auth = { authorization: `Bearer ${key.key}` };

    const me = await app.request("/me", { headers: auth });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ id: userID() });

    expect((await app.request("/todo", { headers: auth })).status).toBe(200);

    await Key.remove(key.id);

    expect((await app.request("/me", { headers: auth })).status).toBe(401);
    expect((await noAuth("/me")).status).toBe(401);
  });
});
