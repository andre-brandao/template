import { describe, expect } from "bun:test";
import { App } from "../src/platform/app";
import { Auth } from "../src/auth";
import { Event } from "../src/platform/event";
import { Identity } from "../src/identity";
import { Webhook } from "../src/platform/webhook";
import { sign } from "../src/util/sign";
import { withTestUser } from "./util";

/** Signs a body the way an external system would, `ago` seconds in the past. */
async function post(app: string, secret: string, body: unknown, ago = 0) {
  const text = JSON.stringify(body);
  const time = Math.floor(Date.now() / 1000) - ago;
  return { app, body: text, timestamp: String(time), signature: await sign(secret, text, time) };
}

describe("app", () => {
  withTestUser(
    "an admin registers an app; its key acts as the bot, owned by them",
    async ({ userID }) => {
      const app = await App.create({ name: "CI" });
      expect(app.owner?.id).toBe(userID);
      expect(await App.list()).toContainEqual(app);

      const key = await App.key({ app: app.id, name: "deploy" });
      expect(await App.keys(app.id)).toHaveLength(1);
      const info = await Auth.resolve(key.key!);
      expect(info.type === "bot" && info.properties.owner.userID).toBe(userID);

      await App.revoke({ app: app.id, id: key.id });
      await expect(Auth.resolve(key.key!)).rejects.toThrow("Invalid or expired API key");
    },
    "admin",
  );

  withTestUser("a member can't register one", async () => {
    await expect(App.create({ name: "CI" })).rejects.toThrow(/app:create/);
  });

  withTestUser(
    "a signed post becomes an app.received event, attributed to the bot",
    async () => {
      const app = await App.create({ name: "Billing" });
      const secret = await App.secret(app.id);
      expect((await App.fromID(app.id))?.inbound).toBe(true);

      const event = await App.receive(
        await post(app.id, secret, { type: "invoice.paid", data: { n: 1 } }),
      );
      expect(event.type).toBe("app.received");

      const log = await Event.list({ sourceID: app.id, page: 1, pageSize: 5 });
      expect(log.data[0]?.data).toEqual({ app: app.id, type: "invoice.paid", data: { n: 1 } });
      expect(log.data[0]?.identity?.type).toBe("bot");
    },
    "admin",
  );

  withTestUser(
    "a post with a wrong, stale or rotated signature is refused",
    async () => {
      const app = await App.create({ name: "Billing" });
      const old = await App.secret(app.id);
      const bad = "Invalid or expired signature";

      await expect(App.receive(await post(app.id, "whsec_wrong", { type: "x" }))).rejects.toThrow(
        bad,
      );
      await expect(App.receive(await post(app.id, old, { type: "x" }, 600))).rejects.toThrow(bad);
      await App.secret(app.id);
      await expect(App.receive(await post(app.id, old, { type: "x" }))).rejects.toThrow(bad);
    },
    "admin",
  );

  withTestUser(
    "removing an app retires its keys, secret and webhooks",
    async () => {
      const app = await App.create({ name: "Gone" });
      const key = await App.key({ app: app.id, name: "k" });
      const secret = await App.secret(app.id);
      await Webhook.create({ url: "https://example.com/in", userID: app.id });

      await App.remove(app.id);
      expect(await App.fromID(app.id)).toBeNull();
      expect(await Webhook.list(app.id)).toHaveLength(0);
      await expect(Auth.resolve(key.key!)).rejects.toThrow();
      await expect(
        Identity.provide("public", {}, async () =>
          App.receive(await post(app.id, secret, { type: "x" })),
        ),
      ).rejects.toThrow("Invalid or expired signature");
    },
    "admin",
  );
});
