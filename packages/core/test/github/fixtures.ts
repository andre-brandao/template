import { Github } from "../../src/github";
import { run } from "../../src/jobs";
import { Queue } from "../../src/lib/queue";
import { memory } from "../../src/lib/queue/adapter/memory";
import { Todo } from "../../src/todo";

/** A unique repo per test: one project per repo is enforced across the shared db. */
export const repo = () => `acme/r${crypto.randomUUID().slice(0, 8)}`;
let seq = Date.now();

type Payload = Github.Webhook.Delivery["payload"];

export function issue(over: Partial<NonNullable<Payload["issue"]>> = {}) {
  return {
    id: ++seq,
    number: seq % 1000,
    title: "Crash on save",
    body: "Steps…",
    state: "open",
    state_reason: null,
    labels: [{ name: "bug" }],
    ...over,
  };
}

/** Delivers through the queue and the worker's runner; outbound webhooks are out of scope. */
export async function deliver(event: string, payload: Payload) {
  await Queue.provide(memory(), async () => {
    await Github.Webhook.job.push({ event, payload });
    while (
      await Queue.tick((job) => (job.name === "webhook.deliver" ? Promise.resolve() : run(job)))
    );
  });
}

export async function linked(id: number) {
  const page = await Todo.list({ pageSize: 100, search: "" });
  return page.data.find((todo) => todo.metadata.annotations["github.com/issue-id"] === String(id));
}
