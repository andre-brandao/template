import { sql } from "drizzle-orm";
import { pgTable as table, text, uniqueIndex } from "drizzle-orm/pg-core";
import { id, timestamp, ulid } from "../drizzle/types";

export const InvitationTable = table(
  "invitation",
  {
    id: id(),
    timeCreated: timestamp("time_created").notNull().defaultNow(),
    timeUpdated: timestamp("time_updated").notNull().defaultNow(),
    orgID: ulid("org_id").notNull(),
    email: text("email").notNull(),
    roleID: ulid("role_id").notNull(),
    inviterID: ulid("inviter_id").notNull(),
    status: text().notNull().default("pending"),
    // The emailed secret — separate from the id, which shows up in logs.
    token: text("token").notNull(),
    timeExpires: timestamp("time_expires").notNull(),
  },
  (table) => [
    uniqueIndex("invitation_token").on(table.token),
    uniqueIndex("invitation_pending")
      .on(table.orgID, table.email)
      .where(sql`${table.status} = 'pending'`),
  ],
);
