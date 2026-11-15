import { describe, expect, it, mock } from "bun:test";
import { App } from "@template/core/app";
import { Identity } from "@template/core/identity";
import { sign } from "@template/core/util/sign";
import { app } from "../../src/api/routes";
import { createUser } from "./util";

async function setup() {
  const admin = await createUser({ name: "Admin", email: `a-${crypto.randomUUID()}@example.com` });
  return Identity.provide("user", { userID: admin.id, role: "admin" }, async () => {
    const made = await App.create({ name: "Billing" });
    return { id: made.id, secret: await App.secret(made.id) };
  });
}

async function post(id: string, secret: string, body: string) {
  const time = Math.floor(Date.now() / 1000);
  return app.request(`/hook/${id}`, {
    method: "post",
    headers: {
      "content-type": "application/json",
      "x-webhook-timestamp": String(time),
      "x-webhook-signature": await sign(secret, body, time),
    },
    body,
  });
}

describe("hook", () => {
  it("accepts a signed post with no bearer and records it", async () => {
    console.log = mock();
    const made = await setup();
    const res = await post(made.id, made.secret, JSON.stringify({ type: "invoice.paid" }));
    expect(res.status).toBe(202);
    expect(((await res.json()) as { id: string }).id).toStartWith("evt_");
  });

  it("refuses a bad signature with a 401", async () => {
    const made = await setup();
    expect((await post(made.id, "whsec_nope", "{}")).status).toBe(401);
  });
});
