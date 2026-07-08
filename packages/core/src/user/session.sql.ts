import { index, pgTable as table, varchar } from "drizzle-orm/pg-core"
import { timestamp, timestamps, ulid } from "../drizzle/types"

export const SessionTable = table(
  "session",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    ...timestamps,
    userID: ulid("user_id").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [index("session_user").on(table.userID)],
)
