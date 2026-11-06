import { z } from "zod";
import { Queue } from "../../lib/queue";
import { Log } from "../../util/log";
import { Issue } from "../issue";
import { issues } from "./issues";
import { subissues } from "./subissues";

/**
 * GitHub → app. The HTTP handler verifies and queues a delivery; the job dispatches it to
 * one handler per event. A new event is a new file here plus a line in `job`.
 */
export namespace Webhook {
  const log = Log.create({ namespace: "core.github" });

  /** One delivery, stripped to the fields the handlers read before it is queued. */
  export const Delivery = z.object({
    event: z.string().meta({ description: "The `X-GitHub-Event` header." }),
    payload: z
      .object({
        action: z.string().optional(),
        issue: Issue.Payload.optional(),
        repository: z.object({ full_name: z.string() }).optional(),
        sender: z.object({ id: z.number() }).optional(),
        parent_issue: Issue.Payload.optional(),
        sub_issue: Issue.Payload.optional(),
      })
      .meta({ description: "The delivery body." }),
  });
  export type Delivery = z.infer<typeof Delivery>;

  /** GitHub's `X-Hub-Signature-256`: `sha256=` + the hex HMAC of the raw body. */
  export async function verify(secret: string, body: string, header?: string | null) {
    const hex = header?.match(/^sha256=([0-9a-f]{64})$/)?.[1];
    if (!secret || !hex) return false;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const sig = Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16));
    return crypto.subtle.verify("HMAC", key, sig, encoder.encode(body));
  }

  export const job = Queue.define("github.receive", Delivery, async (input) => {
    const data = input.payload;
    if (input.event === "issues" && data.issue && data.repository)
      return issues(data.action, data.issue, data.repository.full_name, data.sender?.id);
    if (input.event === "sub_issues" && data.parent_issue && data.sub_issue)
      return subissues(data.action, data.parent_issue.id, data.sub_issue.id, data.sender?.id);
    log.info("ignored", { event: input.event, action: data.action });
  });
}
