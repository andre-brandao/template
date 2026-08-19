import { Database } from "@template/core/drizzle";

// One pool for the test process — mint/seed run per test, and a client each would
// pile up connections against the same Postgres the app under test is using.
// `playwright.config.ts` sets DATABASE_URL before any test module loads.
export const db = Database.connect(process.env.DATABASE_URL!);
