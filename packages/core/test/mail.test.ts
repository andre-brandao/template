import { describe, expect } from "bun:test";
import { Actor } from "../src/actor";
import { Email } from "../src/lib/email";
import { parse } from "../src/lib/email/inbound";
import { Storage } from "../src/lib/storage";
import { Mail, Mailbox } from "../src/platform/mail";
import { withTestUser } from "./util";

/** A mailbox per test, so the shared database never lets one test see another's threads. */
function withMailbox(name: string, cb: (ctx: { address: string; userID: string }) => Promise<any>) {
  return withTestUser(name, async ({ userID }) =>
    Storage.provide(Storage.fake(), async () => {
      const address = `support-${crypto.randomUUID()}@developing.company`;
      await Mailbox.put({ address, fromName: "Support", signature: "— Support" });
      await cb({ address, userID });
    }),
  );
}

function eml(opts: {
  from: string;
  to: string;
  subject: string;
  id?: string;
  inReplyTo?: string;
  refs?: string[];
  body?: string;
  extra?: string[];
}) {
  return [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${opts.id ?? crypto.randomUUID()}@mail.example.com>`,
    ...(opts.inReplyTo ? [`In-Reply-To: <${opts.inReplyTo}>`] : []),
    ...(opts.refs?.length ? [`References: ${opts.refs.map((r) => `<${r}>`).join(" ")}`] : []),
    ...(opts.extra ?? []),
    "Content-Type: text/plain; charset=utf-8",
    "",
    opts.body ?? "Hello there.",
  ].join("\r\n");
}

const attached = (to: string) =>
  [
    "From: jane@acme.io",
    `To: ${to}`,
    "Subject: Invoice",
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@mail.example.com>`,
    'Content-Type: multipart/mixed; boundary="b1"',
    "",
    "--b1",
    "Content-Type: text/plain; charset=utf-8",
    "",
    "The invoice is attached.",
    "--b1",
    'Content-Type: text/plain; name="notes.txt"',
    'Content-Disposition: attachment; filename="notes.txt"',
    "Content-Transfer-Encoding: base64",
    "",
    "aGk=",
    "--b1--",
    "",
  ].join("\r\n");

/** The whole transport contract: raw bytes in, `Mail.receive` under the system actor. */
const deliver = (raw: string) =>
  Actor.provide("system", {}, async () => Mail.receive(await parse(new TextEncoder().encode(raw))));

function capture() {
  const sent: Email.Message[] = [];
  return {
    sent,
    async send(msg: Email.Message) {
      sent.push(msg);
    },
  };
}

describe("mail parse", () => {
  withMailbox("normalises one delivery into one shape", async ({ address }) => {
    const input = await parse(
      new TextEncoder().encode(
        eml({ from: "Jane <JANE@Acme.io>", to: address, subject: "SSO loops", id: "abc" }),
      ),
    );
    expect(input.from).toBe("jane@acme.io");
    expect(input.to).toEqual([address]);
    expect(input.messageID).toBe("abc@mail.example.com");
    expect(input.subject).toBe("SSO loops");
    expect(input.body.trim()).toBe("Hello there.");
    expect(input.headers["date"]).toBeString();
  });

  withMailbox("strips angle brackets off the whole chain", async ({ address }) => {
    const input = await parse(
      new TextEncoder().encode(
        eml({
          from: "j@acme.io",
          to: address,
          subject: "Re: SSO",
          inReplyTo: "a@x",
          refs: ["a@x", "b@x"],
        }),
      ),
    );
    expect(input.inReplyTo).toBe("a@x");
    expect(input.refs).toEqual(["a@x", "b@x"]);
  });
});

describe("mail receive", () => {
  withMailbox("stores a delivery and absorbs the redelivery", async ({ address }) => {
    const raw = eml({ from: "jane@acme.io", to: address, subject: "SSO loops", id: "dup" });
    const first = await deliver(raw);
    expect(first?.from).toBe("jane@acme.io");
    expect(first?.direction).toBe("in");
    expect(first?.thread).toBe(first!.id);
    expect(first?.snippet).toBe("Hello there.");
    expect(await deliver(raw)).toBeNull();
  });

  withMailbox("drops mail for an address that is not ours", async () => {
    expect(
      await deliver(eml({ from: "jane@acme.io", to: "nobody@developing.company", subject: "hi" })),
    ).toBeNull();
  });

  withMailbox("drops auto-replies and list mail", async ({ address }) => {
    const auto = await deliver(
      eml({
        from: "jane@acme.io",
        to: address,
        subject: "Out of office",
        extra: ["Auto-Submitted: auto-replied"],
      }),
    );
    expect(auto).toBeNull();
    const list = await deliver(
      eml({
        from: "news@acme.io",
        to: address,
        subject: "Weekly",
        extra: ["List-Id: <news.acme.io>"],
      }),
    );
    expect(list).toBeNull();
  });

  withMailbox("a reply joins the thread its headers name", async ({ address }) => {
    const first = await deliver(
      eml({ from: "jane@acme.io", to: address, subject: "SSO", id: "root" }),
    );
    const reply = await deliver(
      eml({
        from: "jane@acme.io",
        to: address,
        subject: "Re: SSO",
        // Only the root is named, and only in References — the halfway-copied-in case.
        refs: ["root@mail.example.com"],
      }),
    );
    expect(reply?.thread).toBe(first!.thread);
    expect(await Mail.thread(first!.thread)).toHaveLength(2);
  });

  withMailbox(
    "falls back to subject and sender when no header names a parent",
    async ({ address }) => {
      const first = await deliver(eml({ from: "jane@acme.io", to: address, subject: "Billing" }));
      const next = await deliver(
        eml({ from: "jane@acme.io", to: address, subject: "Re: Billing" }),
      );
      expect(next?.thread).toBe(first!.thread);
      const other = await deliver(
        eml({ from: "someone@else.io", to: address, subject: "Billing" }),
      );
      expect(other?.thread).not.toBe(first!.thread);
    },
  );

  withMailbox("an attachment is a row, and the bytes are on the disk", async ({ address }) => {
    const stored = await deliver(attached(address));
    expect(stored?.attachments).toHaveLength(1);
    const file = stored!.attachments[0]!;
    expect(file.filename).toBe("notes.txt");
    expect(file.size).toBe(2);
    const object = await Storage.disk().get(file.key);
    expect(new TextDecoder().decode(object!.bytes)).toBe("hi");
  });
});

describe("mail views", () => {
  withMailbox("a thread carrying a draft is in both inbox and drafts", async ({ address }) => {
    const received = await deliver(eml({ from: "jane@acme.io", to: address, subject: "SSO" }));
    await Mail.draft({
      mailbox: address,
      thread: received!.thread,
      to: ["jane@acme.io"],
      body: "Looking now.",
    });

    const inbox = await Mail.list({ mailbox: address, view: "inbox" });
    expect(inbox.data).toHaveLength(1);
    expect(inbox.data[0]?.id).toBe(received!.thread);
    expect(inbox.data[0]?.count).toBe(2);
    expect(inbox.data[0]?.draft).toBe(true);
    expect(inbox.data[0]?.unread).toBe(true);
    // The representative row is the newest *sent* message, not the half-written reply.
    expect(inbox.data[0]?.subject).toBe("SSO");

    expect((await Mail.list({ mailbox: address, view: "drafts" })).data).toHaveLength(1);
    expect((await Mail.list({ mailbox: address, view: "sent" })).data).toHaveLength(0);
  });

  withMailbox("read, tag and file write the whole conversation", async ({ address }) => {
    const received = await deliver(eml({ from: "jane@acme.io", to: address, subject: "SSO" }));
    await Mail.read({ thread: received!.thread });
    await Mail.tag({ thread: received!.thread, tags: [" urgent ", "urgent", "sso"] });
    await Mail.file({ thread: received!.thread, source: "opportunity", sourceID: "opp_1" });

    const row = (await Mail.list({ mailbox: address })).data[0]!;
    expect(row.unread).toBe(false);
    expect(row.tags).toEqual(["urgent", "sso"]);
    expect(row.source).toBe("opportunity");
    expect((await Mail.list({ tag: "urgent" })).data.map((t) => t.id)).toContain(received!.thread);
    expect((await Mail.list({ source: "opportunity", sourceID: "opp_1" })).data).toHaveLength(1);
  });

  withMailbox("matches by address and by domain with nothing written", async ({ address }) => {
    const received = await deliver(eml({ from: "jane@acme.io", to: address, subject: "SSO" }));
    expect((await Mail.list({ address: "JANE@acme.io" })).data.map((t) => t.id)).toContain(
      received!.thread,
    );
    expect((await Mail.list({ domain: "acme.io" })).data.map((t) => t.id)).toContain(
      received!.thread,
    );
    expect((await Mail.list({ domain: "nowhere.io" })).data.map((t) => t.id)).not.toContain(
      received!.thread,
    );
  });

  withMailbox("delete is the archive, and trash is restorable", async ({ address }) => {
    const received = await deliver(eml({ from: "jane@acme.io", to: address, subject: "SSO" }));
    await Mail.remove(received!.thread);
    expect((await Mail.list({ mailbox: address, view: "inbox" })).data).toHaveLength(0);
    expect((await Mail.list({ mailbox: address, view: "trash" })).data).toHaveLength(1);
    await Mail.restore(received!.thread);
    expect((await Mail.list({ mailbox: address, view: "inbox" })).data).toHaveLength(1);
  });
});

describe("mail drafts", () => {
  withMailbox("one draft per thread, last write wins", async ({ address, userID }) => {
    const received = await deliver(eml({ from: "jane@acme.io", to: address, subject: "SSO" }));
    const first = await Mail.draft({
      mailbox: address,
      thread: received!.thread,
      to: ["jane@acme.io"],
      body: "one",
    });
    const second = await Mail.draft({
      mailbox: address,
      thread: received!.thread,
      to: ["jane@acme.io"],
      body: "two",
    });
    expect(second.id).toBe(first.id);
    expect(second.body).toBe("two");
    expect(second.createdBy).toBe(userID);
    expect((await Mail.list({ mailbox: address, view: "drafts" })).data).toHaveLength(1);
  });

  withMailbox("a new draft is a thread of one", async ({ address }) => {
    const draft = await Mail.draft({ mailbox: address, to: ["jane@acme.io"], subject: "Q3 usage" });
    expect(draft.thread).toBe(draft.id);
    expect(draft.direction).toBe("out");
    expect(draft.timeSent).toBeNull();
  });

  withMailbox("sending threads the reply and stamps the same row", async ({ address }) => {
    const received = await deliver(
      eml({ from: "jane@acme.io", to: address, subject: "SSO", id: "root" }),
    );
    const draft = await Mail.draft({
      mailbox: address,
      thread: received!.thread,
      to: ["jane@acme.io"],
      subject: "Re: SSO",
      body: "On it.",
    });

    const real = capture();
    const sent = await Email.provide(real, () => Mail.send(draft.id));

    expect(sent.id).toBe(draft.id);
    expect(sent.timeSent).toBeString();
    expect(sent.inReplyTo).toBe("root@mail.example.com");
    expect(real.sent[0]?.headers?.["In-Reply-To"]).toBe("<root@mail.example.com>");
    expect(real.sent[0]?.from).toBe(`Support <${address}>`);
    // The signature is appended on the way out, never baked into the draft.
    expect(real.sent[0]?.body).toBe("On it.\n\n— Support");

    expect((await Mail.list({ mailbox: address, view: "drafts" })).data).toHaveLength(0);
    expect((await Mail.list({ mailbox: address, view: "sent" })).data).toHaveLength(1);
    expect((await Mail.list({ mailbox: address, view: "inbox" })).data).toHaveLength(1);
  });

  withMailbox("a draft with no recipient refuses to send", async ({ address }) => {
    const draft = await Mail.draft({ mailbox: address, body: "unaddressed" });
    expect(Email.provide(capture(), () => Mail.send(draft.id))).rejects.toThrow();
  });

  withMailbox("discarding deletes the row outright", async ({ address }) => {
    const draft = await Mail.draft({ mailbox: address, to: ["jane@acme.io"], body: "never mind" });
    await Mail.discard(draft.id);
    expect(await Mail.fromID(draft.id)).toBeNull();
  });
});
