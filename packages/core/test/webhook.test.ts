import { afterEach, describe, expect } from "bun:test";
import { eq } from "drizzle-orm";
import { Database } from "../src/drizzle";
import { Event } from "../src/event";
import { Identifier } from "../src/identifier";
import { Queue } from "../src/lib/queue";
import { memory } from "../src/lib/queue/adapter/memory";
import { Todo } from "../src/todo";
import { sign } from "../src/util/sign";
import { Webhook } from "../src/webhook";
import { WebhookTable } from "../src/webhook/webhook.sql";
import { withTestUser } from "./util";

type Hit = { headers: Headers; body: string };

/** A real receiver on a throwaway port — the tests exercise fetch, not a stub. */
function receiver(status = 200) {
  const hits: Hit[] = [];
  const server = Bun.serve({
    port: 0,
    fetch: async (req) => {
      hits.push({ headers: req.headers, body: await req.text() });
      return new Response("ok", { status });
    },
  });
  return { hits, url: server.url.href, stop: () => server.stop(true) };
}

/** Subscriptions are global, so a leftover row would receive every later test's events. */
afterEach(() => Database.use((tx) => tx.update(WebhookTable).set({ timeDeleted: new Date() })));

describe("webhook", () => {
  withTestUser(
    "delivers a published event, signed, with the state the event never stored",
    async () => {
      const at = Identifier.create("todo");
      const to = receiver();
      const hook = await Webhook.create({ url: to.url, types: ["todo.created"] });

      await Queue.provide(memory(), async () => {
        await Event.publish({
          type: "todo.created",
          source: "todo",
          sourceID: at,
          data: { title: "Write the report" },
          state: { id: at, title: "Write the report", status: "backlog" },
        });
        await Queue.drain();
      });

      expect(to.hits).toHaveLength(1);
      const hit = to.hits[0]!;
      const body = JSON.parse(hit.body);
      expect(body.type).toBe("todo.created");
      expect(body.data.status).toBe("backlog");

      const time = Number(hit.headers.get("x-webhook-timestamp"));
      expect(hit.headers.get("x-webhook-signature")).toBe(await sign(hook.secret, hit.body, time));
      expect(hit.headers.get("x-webhook-id")).toBe(body.id);

      // The state rides on the job only, and it is all the subscriber gets — the audit
      // row keeps its slim `data`, which never leaves the building.
      expect(body.data).toEqual({ id: at, title: "Write the report", status: "backlog" });
      const row = (await Event.list({ source: "todo", sourceID: at })).data[0]!;
      expect(row.data).toEqual({ title: "Write the report" });
      to.stop();
    },
    "admin",
  );

  withTestUser(
    "an internal event reaches no subscriber",
    async () => {
      const to = receiver();
      // Empty `types` means every *public* type, which is the strongest form of this test.
      await Webhook.create({ url: to.url, types: [] });

      await Queue.provide(memory(), async () => {
        await Event.create({
          type: "user.removed",
          source: "user",
          sourceID: Identifier.create("user"),
        });
        await Queue.drain();
      });

      expect(to.hits).toHaveLength(0);
      to.stop();
    },
    "admin",
  );

  withTestUser(
    "a status change still reaches subscribers, through todo.updated",
    async () => {
      const to = receiver();
      await Webhook.create({ url: to.url, types: ["todo.updated"] });
      const { id } = await Todo.create({ title: "Ship it" });

      await Queue.provide(memory(), async () => {
        await Todo.update({ id, status: "active" });
        await Queue.drain();
      });

      expect(to.hits).toHaveLength(1);
      const body = JSON.parse(to.hits[0]!.body);
      // The audit diff stays internal — subscribers get the todo as it now stands.
      expect(body.data.status).toBe("active");
      to.stop();
    },
    "admin",
  );

  withTestUser(
    "a type it did not subscribe to is skipped",
    async () => {
      const to = receiver();
      await Webhook.create({ url: to.url, types: ["todo.updated"] });

      await Queue.provide(memory(), async () => {
        await Event.publish({
          type: "project.created",
          source: "project",
          sourceID: Identifier.create("project"),
        });
        await Queue.drain();
      });

      expect(to.hits).toHaveLength(0);
      to.stop();
    },
    "admin",
  );

  withTestUser(
    "a failing endpoint is retried alone, not alongside the healthy one",
    async () => {
      const good = receiver();
      const bad = receiver(500);
      await Webhook.create({ url: good.url, types: ["todo.updated"] });
      const broken = await Webhook.create({ url: bad.url, types: ["todo.updated"] });

      const queue = memory();
      await Queue.provide(queue, async () => {
        await Event.publish({
          type: "todo.updated",
          source: "todo",
          sourceID: Identifier.create("todo"),
        });
        await Queue.drain();
      });

      expect(good.hits).toHaveLength(1);
      expect(bad.hits).toHaveLength(1);
      // The follow-up carries only the endpoint that failed, and waits out its delay.
      expect(queue.rows).toHaveLength(1);
      expect((queue.rows[0]!.payload as { ids: string[] }).ids).toEqual([broken.id]);

      const after = (await Webhook.list()).find((row) => row.id === broken.id)!;
      expect(after.failures).toBe(1);
      expect(after.lastStatus).toBe(500);
      good.stop();
      bad.stop();
    },
    "admin",
  );

  withTestUser(
    "a subscription that keeps failing turns itself off",
    async () => {
      const bad = receiver(500);
      const hook = await Webhook.create({ url: bad.url, types: ["todo.removed"] });
      // One short of the limit, so the next failure is the one that trips it.
      await Database.use((tx) =>
        tx.update(WebhookTable).set({ failures: 19 }).where(eq(WebhookTable.id, hook.id)),
      );

      await Queue.provide(memory(), async () => {
        await Event.publish({
          type: "todo.removed",
          source: "todo",
          sourceID: Identifier.create("todo"),
        });
        await Queue.drain();
      });

      const after = (await Webhook.list()).find((row) => row.id === hook.id)!;
      expect(after.failures).toBe(20);
      expect(after.enabled).toBe(false);
      bad.stop();
    },
    "admin",
  );

  withTestUser(
    "removing a subscription cancels the delivery already queued",
    async () => {
      const to = receiver();
      const hook = await Webhook.create({ url: to.url, types: ["todo.removed"] });

      await Queue.provide(memory(), async () => {
        await Event.publish({
          type: "todo.removed",
          source: "todo",
          sourceID: Identifier.create("todo"),
        });
        await Webhook.remove(hook.id);
        await Queue.drain();
      });

      expect(to.hits).toHaveLength(0);
      to.stop();
    },
    "admin",
  );

  withTestUser(
    "re-enabling clears the failure count",
    async () => {
      const hook = await Webhook.create({ url: "https://example.com/hook", types: [] });
      await Database.use((tx) =>
        tx
          .update(WebhookTable)
          .set({ failures: 7, enabled: false })
          .where(eq(WebhookTable.id, hook.id)),
      );

      await Webhook.update({ id: hook.id, enabled: true });

      const after = (await Webhook.list()).find((row) => row.id === hook.id)!;
      expect(after.failures).toBe(0);
      expect(after.enabled).toBe(true);
    },
    "admin",
  );

  withTestUser("a member cannot manage subscriptions", async () => {
    // `Actor.check` runs before the query, so these throw rather than reject.
    expect(() => Webhook.list()).toThrow("Requires webhook:read");
    expect(() => Webhook.create({ url: "https://example.com/hook" })).toThrow(
      "Requires webhook:create",
    );
  });
});
