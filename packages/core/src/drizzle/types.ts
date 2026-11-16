import { char, snakeCase, timestamp as rawTs } from "drizzle-orm/pg-core";

// Tables every workspace shares; tenant tables stay unqualified and follow search_path.
export const central = snakeCase.schema("central");

// Unnamed: `casing: "snake_case"` derives the column from the key.
export const ulid = () => char({ length: 26 + 4 });

export const id = () => ulid().notNull();

export const timestamp = () => rawTs({ precision: 3, mode: "date", withTimezone: true });

export const timestamps = {
  timeCreated: timestamp().notNull().defaultNow(),
  timeUpdated: timestamp().notNull().defaultNow(),
  timeDeleted: timestamp(),
};
