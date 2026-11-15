import { snakeCase, text } from "drizzle-orm/pg-core";
import { timestamp, timestamps } from "../../drizzle/types";

export const KvTable = snakeCase.table("kv", {
  key: text().primaryKey(),
  ...timestamps,
  value: text().notNull(),
  /** Null never expires. Expired rows are hidden on read and deleted lazily. */
  timeExpires: timestamp(),
});
