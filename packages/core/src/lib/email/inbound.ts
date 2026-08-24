import PostalMime from "postal-mime";
import { z } from "zod";

/** The receive cap, ported from the reference. Bigger than this is refused, not truncated. */
export const MAX = 25 * 1024 * 1024;

/**
 * One inbound message, normalised. Every transport produces this and nothing else, so
 * `Mail.receive` never learns which provider delivered it.
 */
export const Inbound = z.object({
  messageID: z.string().nullable().meta({ description: "RFC 5322 Message-ID, brackets stripped." }),
  inReplyTo: z.string().nullable().meta({ description: "The Message-ID this answers." }),
  refs: z.string().array().meta({ description: "The References chain, oldest first." }),
  from: z.string().meta({ description: "Sender address, lowercased." }),
  to: z.string().array().meta({ description: "Recipient addresses, lowercased." }),
  cc: z.string().array().meta({ description: "Copied addresses, lowercased." }),
  subject: z.string().meta({ description: "Subject line, empty when absent." }),
  body: z.string().meta({ description: "Plain text body." }),
  html: z.string().nullable().meta({ description: "Rich body, sanitised before display." }),
  timeSent: z.iso.datetime().nullable().meta({ description: "The sender's `Date` header." }),
  headers: z
    .record(z.string(), z.string())
    .meta({ description: "Every header as received, lowercased keys." }),
  attachments: z
    .object({
      filename: z.string(),
      type: z.string(),
      bytes: z.instanceof(Uint8Array),
      cid: z.string().nullable(),
    })
    .array()
    .meta({ description: "Decoded parts. The bytes go to the disk, never to a column." }),
});
export type Inbound = z.infer<typeof Inbound>;

/** Pure: no database, no disk. One `.eml` fixture therefore tests the whole parse. */
export async function parse(raw: Uint8Array): Promise<Inbound> {
  if (raw.byteLength > MAX) throw new Error(`Email too large: ${raw.byteLength} > ${MAX}`);
  const mail = await PostalMime.parse(raw);
  return {
    messageID: mail.messageId ? strip(mail.messageId) : null,
    inReplyTo: mail.inReplyTo ? strip(mail.inReplyTo) : null,
    refs: (mail.references ?? "").split(/\s+/).filter(Boolean).map(strip),
    from: mail.from?.address?.toLowerCase() ?? "",
    to: addresses(mail.to),
    cc: addresses(mail.cc),
    subject: mail.subject ?? "",
    body: mail.text ?? "",
    html: mail.html ?? null,
    timeSent: mail.date ? new Date(mail.date).toISOString() : null,
    headers: Object.fromEntries(mail.headers.map((h) => [h.key.toLowerCase(), h.value])),
    attachments: mail.attachments.map((a) => ({
      filename: a.filename || "untitled",
      type: a.mimeType || "application/octet-stream",
      bytes: decode(a.content),
      cid: a.contentId ? strip(a.contentId) : null,
    })),
  };
}

/** `Auto-Submitted` and `List-Id` are the two headers that mean "not a conversation". */
export function auto(headers: Record<string, string>) {
  const submitted = headers["auto-submitted"];
  return Boolean(headers["list-id"] || (submitted && submitted !== "no"));
}

// === UTILS ===

/** `<id@host>` → `id@host`. Providers disagree on whether the brackets survive. */
function strip(value: string) {
  return value.match(/<([^>]+)>/)?.[1] ?? value.trim().split(/\s+/)[0] ?? value;
}

type Addr = { address?: string; name?: string; group?: Addr[] };

/** Flattens RFC 5322 groups, which carry their members rather than an address of their own. */
function addresses(list?: Addr[]): string[] {
  return (list ?? [])
    .flatMap((a) => (a.group?.length ? a.group : [a]))
    .map((a) => a.address?.toLowerCase())
    .filter((a): a is string => Boolean(a));
}

/** postal-mime hands back a string for text parts and a buffer for everything else. */
function decode(content: string | ArrayBuffer | Uint8Array) {
  if (typeof content === "string") return new TextEncoder().encode(content);
  if (content instanceof Uint8Array) return new Uint8Array(content);
  return new Uint8Array(content);
}
