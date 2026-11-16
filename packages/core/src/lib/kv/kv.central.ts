import { text } from "drizzle-orm/pg-core";
import { central, timestamp, timestamps } from "../../drizzle/types";

export const KvTable = central.table("kv", {
  key: text().primaryKey(),
  ...timestamps,
  value: text().notNull(),
  /** Null never expires. Expired rows are hidden on read and deleted lazily. */
  timeExpires: timestamp(),
});
