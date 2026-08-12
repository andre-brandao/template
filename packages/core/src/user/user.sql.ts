import { boolean, jsonb, pgTable as table, uniqueIndex, text } from "drizzle-orm/pg-core";
import { id, timestamps } from "../drizzle/types";
import { Permission } from "../permission";
import { DEFAULTS, type Prefs } from "./prefs";

export const UserTable = table(
  "user",
  {
    id: id(),
    ...timestamps,
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    // `$type` narrows `$inferSelect` to the role union, so the actor boundary needs no cast.
    role: text().$type<Permission.Role>().notNull().default("member"),
    // Defaulting to the whole object, not `{}`, backfills existing rows in the same
    // ALTER statement — so reads never have to cope with a half-empty blob.
    prefs: jsonb().$type<Prefs>().notNull().default(DEFAULTS),
  },
  (table) => [uniqueIndex("user_email").on(table.email)],
);
