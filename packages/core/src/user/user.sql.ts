import { boolean, pgTable as table, uniqueIndex, text } from "drizzle-orm/pg-core"
import { id, timestamps } from "../drizzle/types"

export const UserTable = table(
  "user",
  {
    id: id(),
    ...timestamps,
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
  },
  (table) => [uniqueIndex("user_email").on(table.email)],
)
