import { index, pgTable as table, uniqueIndex } from "drizzle-orm/pg-core";
import { id, timestamp, ulid } from "../drizzle/types";

// Hard-deleted so the (org_id, user_id) unique stays simple across re-invites.
export const MemberTable = table(
  "member",
  {
    id: id(),
    timeCreated: timestamp("time_created").notNull().defaultNow(),
    timeUpdated: timestamp("time_updated").notNull().defaultNow(),
    orgID: ulid("org_id").notNull(),
    userID: ulid("user_id").notNull(),
    roleID: ulid("role_id").notNull(),
  },
  (table) => [
    uniqueIndex("member_org_user").on(table.orgID, table.userID),
    index("member_user").on(table.userID),
  ],
);
