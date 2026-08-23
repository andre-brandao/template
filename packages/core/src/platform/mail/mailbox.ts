import { z } from "zod";
import { Actor } from "../../actor";
import { Storage } from "../../lib/storage";
import { fn } from "../../util/fn";

/**
 * The addresses the app receives on. Not a table: each is a small JSON object on the same
 * disk the attachments use, keyed by the address a message writes down. Deleting one
 * therefore cannot orphan a message, and adding one is a file write, not a migration.
 */
export namespace Mailbox {
  export const Settings = z
    .object({
      address: z.string().toLowerCase().meta({
        description: "The key, and the From address replies go out under.",
        example: "support@developing.company",
      }),
      fromName: z
        .string()
        .nullable()
        .meta({ description: "Display name replies go out under.", example: "Support" }),
      signature: z
        .string()
        .nullable()
        .meta({ description: "Appended to the body when a reply is sent." }),
    })
    .meta({ ref: "Mailbox", description: "An address the app accepts mail on." });
  export type Settings = z.infer<typeof Settings>;

  const PREFIX = "mailboxes/";

  /** Null when the address is not one of ours — the check `Mail.receive` gates on. */
  export async function get(address: string) {
    const object = await Storage.disk().get(key(address));
    if (!object) return null;
    return Settings.parse(JSON.parse(new TextDecoder().decode(object.bytes)));
  }

  export const list = fn(
    z.void(),
    async () => {
      Actor.check({ mail: ["read"] });
      const keys = await Storage.disk().files(PREFIX);
      const boxes = await Promise.all(
        keys.map((k) => get(k.slice(PREFIX.length, -".json".length))),
      );
      return boxes.filter((box): box is Settings => box !== null);
    },
    { title: "List mailboxes", description: "The addresses the app receives mail on." },
  );

  export const put = fn(
    Settings.partial({ fromName: true, signature: true }),
    async (input) => {
      Actor.check({ mail: ["update"] });
      const box = {
        ...input,
        fromName: input.fromName ?? null,
        signature: input.signature ?? null,
      };
      await Storage.disk().put(
        key(box.address),
        new TextEncoder().encode(JSON.stringify(box)),
        "application/json",
      );
      return box;
    },
    {
      title: "Save mailbox",
      description: "Create or replace a mailbox — the address, its display name and signature.",
    },
  );

  export const remove = fn(
    Settings.shape.address,
    async (address) => {
      Actor.check({ mail: ["delete"] });
      await Storage.disk().delete(key(address));
    },
    {
      title: "Delete mailbox",
      description: "Stop accepting mail on an address. Messages already stored are untouched.",
    },
  );

  // === UTILS ===

  const key = (address: string) => `${PREFIX}${address.toLowerCase()}.json`;
}
