import { describe, expect } from "bun:test";
import { setupApiTest } from "./util";
import { App } from "@template/core/app";
import { Webhook } from "@template/core/webhook";

const { test, validateOpenAPIRoute } = setupApiTest("admin");

describe("webhook", () => {
  test("GET /webhook", async () => {
    const hook = await Webhook.create({ url: "https://example.com/all" });
    const response = await validateOpenAPIRoute("get", "/webhook");
    expect(response.map((row: Webhook.Info) => row.id)).toContain(hook.id);
  });

  test("GET /webhook?owner= lists one owner's", async () => {
    const made = await App.create({ name: "Owner" });
    const hook = await Webhook.create({ url: "https://example.com/app", userID: made.id });
    await Webhook.create({ url: "https://example.com/other" });
    const response = await validateOpenAPIRoute("get", "/webhook", { owner: made.id });
    expect(response.map((row: Webhook.Info) => row.id)).toEqual([hook.id]);
  });

  test("POST /webhook", async () => {
    const response = await validateOpenAPIRoute("post", "/webhook", undefined, {
      url: "https://example.com/hooks",
    });
    expect(response.url).toBe("https://example.com/hooks");
    expect(response.types).toEqual([]);
  });

  test("PATCH /webhook/:id", async () => {
    const hook = await Webhook.create({ url: "https://example.com/toggle" });
    const response = await validateOpenAPIRoute(
      "patch",
      "/webhook/:id",
      { id: hook.id },
      { enabled: false },
    );
    expect(response.enabled).toBe(false);
  });

  test("DELETE /webhook/:id", async () => {
    const hook = await Webhook.create({ url: "https://example.com/gone" });
    await validateOpenAPIRoute("delete", "/webhook/:id", { id: hook.id });
    expect((await Webhook.list()).map((row) => row.id)).not.toContain(hook.id);
  });
});
