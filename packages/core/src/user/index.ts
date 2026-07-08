import { z } from "zod"
import { eq } from "drizzle-orm"
import { fn } from "../util/fn"
import { Database } from "../drizzle"
import { Actor } from "../actor"
import { Common } from "../common"
import { Examples } from "../examples"
import { Identifier } from "../identifier"
import { UserTable } from "./user.sql"

export namespace User {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.User.id }),
      name: z.string(),
      email: z.string(),
      emailVerified: z.boolean(),
      image: z.string().nullable(),
    })
    .meta({
      ref: "User",
      description: "A user account.",
      example: Examples.User,
    })
  export type Info = z.infer<typeof Info>

  export const create = fn(
    z.object({
      name: z.string().min(1),
      email: z.email(),
      emailVerified: z.boolean().optional(),
      image: z.string().nullable().optional(),
    }),
    async (input) => {
      const id = Identifier.create("user")
      await Database.use((tx) =>
        tx.insert(UserTable).values({
          id,
          name: input.name,
          email: input.email,
          emailVerified: input.emailVerified ?? false,
          image: input.image ?? null,
        }),
      )
      return id
    },
  )

  export const fromID = fn(z.string(), (id) =>
    Database.use((tx) =>
      tx
        .select()
        .from(UserTable)
        .where(eq(UserTable.id, id))
        .then((rows) => rows.at(0) ?? null),
    ),
  )

  export const fromEmail = fn(z.string(), (email) =>
    Database.use((tx) =>
      tx
        .select()
        .from(UserTable)
        .where(eq(UserTable.email, email))
        .then((rows) => rows.at(0) ?? null),
    ),
  )

  export const update = fn(
    z.object({ name: z.string().min(1).optional(), image: z.string().nullable().optional() }),
    (input) =>
      Database.use((tx) =>
        tx
          .update(UserTable)
          .set({ ...input, timeUpdated: new Date() })
          .where(eq(UserTable.id, Actor.userID())),
      ),
  )
}
