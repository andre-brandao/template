import { describe, expect, test } from "bun:test";
import { Queue } from "@template/core/queue";
import { app } from "../../src/api/routes";

const secret = "webhook-secret";

async function sign(body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `sha256=${Buffer.from(sig).toString("hex")}`;
}

function deliver(body: string, signature?: string) {
  return app.request("/github/webhook", {
    method: "post",
    headers: {
      "content-type": "application/json",
      "x-github-event": "ping",
      ...(signature ? { "x-hub-signature-256": signature } : {}),
    },
    body,
  });
}

// Public by design: GitHub authenticates with the signature, not a bearer token.
describe("github webhook", () => {
  const body = JSON.stringify({ zen: "Keep it logically awesome." });

  test("rejects a missing or wrong signature", async () => {
    process.env.GITHUB_WEBHOOK_SECRET = secret;
    expect((await deliver(body)).status).toBe(401);
    expect((await deliver(body, "sha256=" + "0".repeat(64))).status).toBe(401);
  });

  test("rejects everything when no secret is configured", async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    expect((await deliver(body, await sign(body))).status).toBe(401);
  });

  test("queues a signed delivery", async () => {
    process.env.GITHUB_WEBHOOK_SECRET = secret;
    const queue = Queue.Providers.memory();
    const res = await Queue.provide(queue, async () => deliver(body, await sign(body)));
    expect(res.status).toBe(200);
    expect(await res.json()).toBe("ok");
    expect(queue.rows.map((row) => row.name)).toEqual(["github.receive"]);
  });
});
