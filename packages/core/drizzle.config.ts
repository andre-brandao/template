import { defineConfig } from "drizzle-kit";

// `db:push` only (tests, dev): both sets at once. `db:generate` runs the split
// drizzle.central/tenant configs, since a tenant migration must stay unqualified.
export default defineConfig({
  verbose: true,
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/postgres",
  },
  // types.ts exports `central`; drizzle-kit only creates schemas it finds exported.
  schema: ["./src/drizzle/types.ts", "./src/**/*.central.ts", "./src/**/*.sql.ts"],
  schemaFilter: ["public", "central"],
});
