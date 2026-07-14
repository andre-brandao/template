import { z } from "zod";
import { eq } from "drizzle-orm";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { UserTable } from "./user.sql";
import { ProviderIds, ProviderTable } from "./provider.sql";

export namespace User {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.User.id }),
      name: z.string().min(1),
      email: z.string().email(),
      emailVerified: z.boolean().optional(),
      image: z.string().nullable(),
    })
    .meta({
      ref: "User",
      description: "A user account.",
      example: Examples.User,
    });
  export type Info = z.infer<typeof Info>;

  /**
   * A login provider, connected or not. Not exposed over the HTTP API — the
   * dashboard reads this straight from core.
   */
  export const Provider = z.object({
    id: z.enum(ProviderIds),
    /** The identity held at the provider — an email, or its own user id. Null when not connected. */
    accountId: z.string().nullable(),
    connected: z.boolean(),
    timeCreated: z.iso.datetime().nullable(),
  });
  export type Provider = z.infer<typeof Provider>;

  /**
   * Every known provider with its connection state — not just the connected
   * ones — so the profile can offer the rest. Passwords are never selected.
   */
  export const providers = fn(z.void(), () =>
    Database.use(async (tx) => {
      const rows = await tx
        .select({
          providerId: ProviderTable.providerId,
          accountId: ProviderTable.accountId,
          timeCreated: ProviderTable.timeCreated,
        })
        .from(ProviderTable)
        .where(eq(ProviderTable.userID, Actor.userID()));

      return ProviderIds.map((id) => {
        const row = rows.find((row) => row.providerId === id);
        return {
          id,
          accountId: row?.accountId ?? null,
          connected: Boolean(row),
          timeCreated: row?.timeCreated.toISOString() ?? null,
        };
      });
    }),
  );

  export const create = fn(
    z.object({
      name: Info.shape.name,
      email: Info.shape.email,
      emailVerified: Info.shape.emailVerified,
      image: Info.shape.image.optional(),
    }),
    async (input) => {
      const id = Identifier.create("user");
      await Database.use((tx) =>
        tx.insert(UserTable).values({
          id,
          name: input.name,
          email: input.email,
          emailVerified: input.emailVerified ?? false,
          image: input.image ?? null,
        }),
      );
      return id;
    },
  );

  export const fromID = fn(Info.shape.id, (id) =>
    Database.use((tx) =>
      tx
        .select()
        .from(UserTable)
        .where(eq(UserTable.id, id))
        .then((rows) => rows.at(0) ?? null),
    ),
  );

  export const fromEmail = fn(Info.shape.email, (email) =>
    Database.use((tx) =>
      tx
        .select()
        .from(UserTable)
        .where(eq(UserTable.email, email))
        .then((rows) => rows.at(0) ?? null),
    ),
  );

  export const update = fn(
    z.object({ name: Info.shape.name.optional(), image: Info.shape.image.optional() }),
    (input) =>
      Database.use((tx) =>
        tx
          .update(UserTable)
          .set({ ...input, timeUpdated: new Date() })
          .where(eq(UserTable.id, Actor.userID())),
      ),
  );
}
