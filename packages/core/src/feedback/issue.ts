import { z } from "zod";
import { Actor } from "../actor";
import { ErrorCodes, VisibleError } from "../error";
import { Storage } from "../lib/storage";
import { User } from "../user";
import { Assert } from "../util/assert";
import { fn } from "../util/fn";
import { LIMIT, PREFIX, owner } from "./attachment";
import { title, trailer } from "./body";
import { use } from "./driver";
import { Tags, Urgencies } from "./port";

const assert = Assert.create("Feedback");

export const Attachment = z
  .object({
    key: z.string().min(1).meta({ description: "Storage key `upload` returned." }),
    name: z.string().max(200).meta({ description: "File name shown in the link." }),
    type: z.string().max(100).meta({ description: "MIME type; images render inline." }),
    url: z.url().meta({ description: "Where the issue links it: the caller's read route." }),
  })
  .meta({ description: "A file already stored by `upload`, linked from the issue body." });

export const Input = z.object({
  body: z
    .string()
    .trim()
    .min(10, "Tell us a bit more: at least 10 characters.")
    .max(10000)
    .meta({ description: "What happened or what you'd like, markdown. The first line titles it." }),
  tag: z.enum(Tags).meta({ description: "Kind of submission." }),
  urgency: z
    .enum(Urgencies)
    .optional()
    .meta({ description: "How much it hurts. Defaults to medium." }),
  page: z.string().max(500).optional().meta({ description: "Where the sender was." }),
  agent: z.string().max(500).optional().meta({ description: "The browser's user agent." }),
  viewport: z.string().max(50).optional().meta({ description: "Window size, e.g. 1280x720." }),
  locale: z.string().max(50).optional().meta({ description: "The browser's locale." }),
  timezone: z.string().max(100).optional().meta({ description: "IANA zone." }),
  attachments: Attachment.array()
    .max(LIMIT, `At most ${LIMIT} attachments`)
    .optional()
    .meta({ description: "Uploaded images or PDFs to link from the body." }),
});

const Filter = z.object({
  state: z.enum(["open", "closed"]).optional(),
  tag: z.enum(Tags).optional(),
});

/** Files one submission as the actor. Attachments must be the actor's own uploads. */
export const create = fn(
  Input,
  async (input) => {
    Actor.check({ feedback: ["create"] });
    const actor = Actor.use();
    const sender = actor.type === "user" ? await User.fromID(actor.properties.userID) : null;
    await Promise.all(
      (input.attachments ?? []).map(async (file) => {
        if (file.key.startsWith(`${PREFIX}${owner()}/`) && (await Storage.disk().exists(file.key)))
          return;
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.INVALID_PARAMETER,
          `Unknown attachment: ${file.name}`,
          "attachments",
        );
      }),
    );
    return use().create({
      title: title(input.body),
      body: trailer(input, sender ?? undefined, input.attachments),
      tag: input.tag,
      urgency: input.urgency ?? "medium",
    });
  },
  {
    title: "Send feedback",
    description:
      "File a bug report, feature request or support question with the team. The first line of the body becomes its title.",
  },
);

/** The actor's own submissions, newest first. */
export const mine = fn(z.void(), () => {
  const id = Actor.userID();
  Actor.check({ feedback: ["read"] }, id);
  return use().mine(id);
});

/** Everyone's submissions, newest first. The back office's list. */
export const list = fn(Filter, (filter) => {
  Actor.check({ feedback: ["read"] });
  return use().list(filter);
});

/** One submission with its body and replies; its sender may read it too. */
export const get = fn(z.number().int().positive(), async (id) => {
  const found = await assert.exists(use().get(id));
  Actor.check({ feedback: ["read"] }, found.user ?? undefined);
  return found;
});
