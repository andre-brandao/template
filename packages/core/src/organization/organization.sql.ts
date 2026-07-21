import { pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamps } from "../drizzle/types";

export const OrganizationTable = table("organization", {
  id: id(),
  ...timestamps,
  name: text("name").notNull(),
});
