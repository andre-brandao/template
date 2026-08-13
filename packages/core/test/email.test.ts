import { describe, expect, it } from "bun:test";
import { Actor } from "../src/actor";
import { Email } from "../src/lib/email";
import { Queue } from "../src/lib/queue";
import { memory } from "../src/lib/queue/adapter/memory";

/** Stands in for whatever the worker provides — SES, Cloudflare, the console driver. */
function capture() {
  const sent: Email.Message[] = [];
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
        await Email.provide(Email.Providers.queue(), () =>
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
