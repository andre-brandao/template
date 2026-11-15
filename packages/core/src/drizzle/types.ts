import { char, timestamp as rawTs } from "drizzle-orm/pg-core";

// Unnamed: `casing: "snake_case"` derives the column from the key.
export const ulid = () => char({ length: 26 + 4 });

export const id = () => ulid().notNull();

export const timestamp = () => rawTs({ precision: 3, mode: "date", withTimezone: true });

export const timestamps = {
  timeCreated: timestamp().notNull().defaultNow(),
  timeUpdated: timestamp().notNull().defaultNow(),
  timeDeleted: timestamp(),
};
