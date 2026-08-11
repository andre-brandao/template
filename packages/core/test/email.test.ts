import { describe, expect, it } from "bun:test";
import { Actor } from "../src/actor";
import { Email } from "../src/email";
import { createQueueSender } from "../src/email/adapter/queue";
import { Queue } from "../src/queue";
import { memory } from "../src/queue/adapter/memory";

/** Stands in for whatever the worker provides — SES, Cloudflare, the console sender. */
function capture() {
  const sent: Parameters<Email.SenderPort["send"]>[0][] = [];
  return {
    sent,
    async send(input: (typeof sent)[number]) {
      sent.push(input);
    },
  };
}

describe("email queue sender", () => {
  it("pushes the mail instead of sending it", async () => {
    const queue = memory();
    const real = capture();

    await Actor.provide("public", {}, () =>
      Queue.provide(queue, async () => {
        await Email.provide(createQueueSender(), () =>
          Email.send({
            to: "ada@example.com",
            subject: "hello",
            body: "hi",
            attachments: [{ filename: "a.txt", content: "aGk=" }],
          }),
        );

        expect(real.sent).toEqual([]);
        expect(queue.rows).toHaveLength(1);
        expect(queue.rows[0]?.name).toBe("email.send");

        // The worker holds the sender that actually delivers.
        expect(await Email.provide(real, () => Queue.drain())).toBe(1);
      }),
    );

    expect(real.sent[0]).toMatchObject({
      to: "ada@example.com",
      subject: "hello",
      body: "hi",
      attachments: [{ filename: "a.txt", content: "aGk=" }],
    });
    expect(real.sent[0]?.from).toBeString();
  });
});
