import { defineConfig } from "drizzle-kit";

// Tables every workspace shares, in the `central` schema.
export default defineConfig({
  verbose: true,
  out: "./migrations/central",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/postgres",
  },
  // types.ts exports `central`; drizzle-kit only creates schemas it finds exported.
  schema: ["./src/drizzle/types.ts", "./src/**/*.central.ts"],
  schemaFilter: ["central"],
});
