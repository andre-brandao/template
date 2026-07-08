import { bigint, char, timestamp as rawTs } from "drizzle-orm/pg-core";

export const ulid = (name: string) => char(name, { length: 26 + 4 });

export const id = () => ulid("id").notNull()

export const timestamp = (name: string) =>
  rawTs(name, {
    precision: 3,
    mode: "date",
    withTimezone: true,
  });

export const dollar = (name: string) =>
  bigint(name, {
    mode: "number",
  });

export const timestamps = {
  timeCreated: timestamp("time_created").notNull().defaultNow(),
  timeUpdated: timestamp("time_updated").notNull().defaultNow(),
  timeDeleted: timestamp("time_deleted"),
};
