import { boolean, index, integer, pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../../drizzle/types";

/**
 * An outbound subscription. `secret` is stored plaintext so deliveries can be signed;
 * `failures` counts consecutive failed POSTs and trips `enabled` off at the limit.
 */
export const WebhookTable = table(
  "webhook",
  {
    id: id(),
    ...timestamps,
    createdBy: ulid("created_by").notNull(),
    url: text().notNull(),
    secret: text().notNull(),
    // Empty means every public type. Matched with `types @> ARRAY[type]`.
    types: text().array().notNull().default([]),
    enabled: boolean().notNull().default(true),
    failures: integer().notNull().default(0),
    lastStatus: integer("last_status"),
    timeDelivered: timestamp("time_delivered"),
  },
  (table) => [index("webhook_enabled").on(table.enabled)],
);
