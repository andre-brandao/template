import { defineConfig } from "drizzle-kit";

// Unqualified per-workspace tables; `Migrations.tenant` replays them into each schema.
export default defineConfig({
  verbose: true,
  out: "./migrations/tenant",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/postgres",
  },
  schema: "./src/**/*.sql.ts",
});
