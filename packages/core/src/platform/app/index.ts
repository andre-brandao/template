import { z } from "zod";
import { and, asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { fn } from "../../util/fn";
import { Assert } from "../../util/assert";
import { sign } from "../../util/sign";
import { equal } from "../../util/hash";
import { token } from "../../util/token";
import { Auth } from "../../auth";
import { Bus } from "../bus";
import { Common } from "../../common";
import { Database } from "../../drizzle";
import { ErrorCodes, VisibleError } from "../../error";
import { Examples } from "../../examples";
import { Identity } from "../../identity";
import { Identifier } from "../../identifier";
import { User } from "../../user";
import { UserTable } from "../../user/user.sql";
import { Key } from "../key";
import { KeyTable } from "../key/key.sql";
import { Webhook } from "../webhook";

/** Five minutes either side of now: long enough for clock skew, short enough to stop replays. */
const SKEW = 5 * 60;

/**
 * External systems, registered in Developers. An App is a system account (`kind: "system"`) owned
 * by the admin who made it: its API keys act as that account, its webhooks are filed under it, and
 * its inbound secret lets it post events in. Admin-only — `app:*` is not a member grant.
 */
export namespace App {
  export const assert = Assert.create("App");

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.User.id }),
      name: z.string().min(1).max(255).meta({ description: "What the external system is called." }),
      owner: z
        .object({ id: z.string(), name: z.string() })
        .nullable()
        .meta({ description: "The admin answerable for it. Null once they are gone." }),
      inbound: z
        .boolean()
        .meta({ description: "Whether it holds a secret to post events in with." }),
      timeCreated: z.iso.datetime().meta({ description: "When it was registered." }),
    })
    .meta({ ref: "App", description: "An external system acting through its own system account." });
  export type Info = z.infer<typeof Info>;

  /**
   * What an App posted in. Not a public type, so it never goes back out to webhooks; it is the
   * hook a workflow subscribes to. Published as the App's account, which the event log records.
   */
  export const Received = Bus.define(
    "app.received",
    z.object({
      app: z.string(),
      type: z.string(),
      data: z.unknown().optional(),
    }),
  );

  export const create = fn(
    Info.pick({ name: true }),
    async (input) => {
      Identity.check({ app: ["create"] });
      const account = await User.create({
        name: input.name,
        // Apps never log in, but the column is unique and required. `.invalid` can't resolve.
        email: `${Identifier.create("user").toLowerCase()}@app.invalid`,
        kind: "system",
        ownerID: Identity.userID(),
      });
      return assert.exists(fromID(account.id));
    },
    {
      title: "Create app",
      description:
        "Register an external system as a system account owned by the current admin. Admin-only.",
    },
  );

  export const list = fn(
    z.void(),
    () => {
      Identity.check({ app: ["read"] });
      return query().then((rows) => rows.map(serialize));
    },
    { title: "List apps", description: "List every registered app, by name. Admin-only." },
  );

  export const fromID = fn(
    Info.shape.id,
    (id) => {
      Identity.check({ app: ["read"] });
      return query(id).then((rows) => (rows[0] ? serialize(rows[0]) : null));
    },
    { title: "Get app", description: "Get one registered app by id. Admin-only." },
  );

  /** Renames the App or swaps its avatar — the account's own profile fields, which only admins edit. */
  export const update = fn(
    z.object({
      id: Info.shape.id,
      name: Info.shape.name.optional(),
      image: z.string().nullable().optional(),
    }),
    async (input) => {
      Identity.check({ app: ["update"] });
      await assert.exists(fromID(input.id));
      await Database.use((tx) =>
        tx
          .update(UserTable)
          .set({ name: input.name, image: input.image, timeUpdated: new Date() })
          .where(eq(UserTable.id, input.id)),
      );
    },
    { title: "Update app", description: "Rename an app or change its avatar. Admin-only." },
  );

  /** Disables the account. Its keys stop resolving at once, and its webhooks stop with them. */
  export const remove = fn(
    Info.shape.id,
    async (id) => {
      Identity.check({ app: ["delete"] });
      await assert.exists(fromID(id));
      await Database.transaction(async (tx) => {
        await tx.update(UserTable).set({ timeDeleted: new Date() }).where(eq(UserTable.id, id));
        for (const hook of await Webhook.list(id)) await Webhook.remove(hook.id);
      });
    },
    {
      title: "Remove app",
      description:
        "Disable an app's account. Its keys stop authenticating and its webhooks are removed. Admin-only.",
    },
  );

  /** The App's API keys. A key acts as the App, capped at its owner's role. */
  export const keys = fn(
    Info.shape.id,
    async (id) => {
      Identity.check({ app: ["read"] });
      await assert.exists(fromID(id));
      return Key.owned(id);
    },
    {
      title: "List app keys",
      description:
        "List an app's live API keys. Secrets are stored hashed, so `key` is null here. Admin-only.",
    },
  );

  export const key = fn(
    z.object({
      app: Info.shape.id,
      name: Key.Info.shape.name,
      expiresAt: z.date().nullable().optional(),
    }),
    async (input) => {
      Identity.check({ app: ["update"] });
      await assert.exists(fromID(input.app));
      return Key.create({ userID: input.app, name: input.name, expiresAt: input.expiresAt });
    },
  );

  export const revoke = fn(
    z.object({ app: Info.shape.id, id: Key.Info.shape.id }),
    (input) => {
      Identity.check({ app: ["update"] });
      return Key.revoke({ id: input.id, user: input.app });
    },
    {
      title: "Revoke app key",
      description: "Revoke one of an app's API keys. It stops authenticating at once. Admin-only.",
    },
  );

  /**
   * Mints the inbound secret, retiring the last one. Plaintext in the `key` table under
   * `type: "hook"`, like a webhook's: verifying an HMAC needs the secret itself.
   */
  export const secret = fn(
    Info.shape.id,
    async (id) => {
      Identity.check({ app: ["update"] });
      await assert.exists(fromID(id));
      const value = token("whsec_");
      await Database.transaction(async (tx) => {
        await tx.delete(KeyTable).where(and(eq(KeyTable.userID, id), eq(KeyTable.type, "hook")));
        await tx.insert(KeyTable).values({
          id: Identifier.create("key"),
          userID: id,
          name: "inbound",
          key: value,
          type: "hook",
        });
      });
      return value;
    },
    {
      title: "Rotate app secret",
      description:
        "Mint the app's inbound signing secret, retiring the last one. Returned once, so copy it then. Admin-only.",
    },
  );

  /**
   * An inbound post: `{ type, data }`, signed the way outbound deliveries are — HMAC over
   * `${body}.${timestamp}` in `x-webhook-signature`. It does nothing but publish `Received`;
   * what happens next is a subscriber's to decide. Public: the signature is the credential.
   */
  export const receive = fn(
    z.object({
      app: z.string(),
      body: z.string(),
      timestamp: z.string(),
      signature: z.string(),
    }),
    async (input) => {
      const time = Number(input.timestamp);
      const held = await Database.use((tx) =>
        tx
          .select({ secret: KeyTable.key })
          .from(KeyTable)
          .innerJoin(UserTable, eq(UserTable.id, KeyTable.userID))
          .where(
            and(
              eq(KeyTable.userID, input.app),
              eq(KeyTable.type, "hook"),
              isNull(UserTable.timeDeleted),
            ),
          )
          .then((rows) => rows.at(0)),
      );
      const fresh = Number.isFinite(time) && Math.abs(Date.now() / 1000 - time) <= SKEW;
      const expected = held && fresh ? await sign(held.secret, input.body, time) : "";
      // One answer for every way it can fail, so a probe learns nothing about which App exists.
      // Constant-time, so the comparison can't be timed into revealing the signature.
      const text = new TextEncoder();
      if (!expected || !equal(text.encode(expected), text.encode(input.signature)))
        throw new VisibleError(
          "authentication",
          ErrorCodes.Authentication.INVALID_TOKEN,
          "Invalid or expired signature",
        );

      const parsed = z
        .object({ type: z.string().min(1).max(128), data: z.unknown().optional() })
        .safeParse(JSON.parse(input.body || "null"));
      if (!parsed.success)
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.INVALID_PARAMETER,
          "Body must be JSON with a `type` and optional `data`",
        );

      return Identity.enter(await Auth.identify(input.app), () =>
        Received.publish(
          { app: input.app, type: parsed.data.type, data: parsed.data.data },
          { subject: input.app, tags: [`app:${input.app}`] },
        ),
      );
    },
  );

  function serialize(row: Awaited<ReturnType<typeof query>>[number]): Info {
    return {
      id: row.id,
      name: row.name,
      owner: row.ownerId ? { id: row.ownerId, name: row.ownerName ?? "" } : null,
      inbound: !!row.inbound,
      timeCreated: row.timeCreated.toISOString(),
    };
  }

  // === UTILS ===

  function query(id?: string) {
    const owner = alias(UserTable, "owner");
    return Database.use((tx) =>
      tx
        .select({
          id: UserTable.id,
          name: UserTable.name,
          timeCreated: UserTable.timeCreated,
          ownerId: owner.id,
          ownerName: owner.name,
          inbound: KeyTable.id,
        })
        .from(UserTable)
        .leftJoin(owner, and(eq(owner.id, UserTable.ownerID), isNull(owner.timeDeleted)))
        .leftJoin(KeyTable, and(eq(KeyTable.userID, UserTable.id), eq(KeyTable.type, "hook")))
        .where(
          and(
            eq(UserTable.kind, "system"),
            isNull(UserTable.timeDeleted),
            id ? eq(UserTable.id, id) : undefined,
          ),
        )
        .orderBy(asc(UserTable.name)),
    );
  }
}
