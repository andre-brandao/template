import { defineConfig } from "drizzle-kit";
// import { Resource } from "sst";

export default defineConfig({
  strict: true,
  verbose: true,
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/postgres",
  },
  schema: "./src/**/*.sql.ts",
});
