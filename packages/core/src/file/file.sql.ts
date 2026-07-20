import { index, integer, pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamp, ulid } from "../drizzle/types";

export const FileTable = table(
  "file",
  {
    id: id(),
    timeCreated: timestamp("time_created").notNull().defaultNow(),
    userID: ulid("user_id").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    tags: text().array().notNull().default([]),
    key: text("key").notNull(),
  },
  (table) => [index("file_user").on(table.userID)],
);
