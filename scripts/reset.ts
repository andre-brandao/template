#!/usr/bin/env bun

import { Database, sql } from "@template/core/drizzle";

// Drops every schema the app owns so the next db:push rebuilds from scratch.
const db = Database.connect();

await Database.provide(db, () =>
  Database.use(async (tx) => {
    const rows = await tx.execute<{ name: string }>(
      sql`select nspname as name from pg_namespace where nspname like 'ws\\_%'`,
      "objects",
    );
    const drops = ["central", "drizzle", ...[...rows].map((row) => row.name)]
      .map((name) => `drop schema if exists "${name}" cascade;`)
      .join(" ");
    await tx.execute(
      sql.raw(`${drops} drop schema public cascade; create schema public;`),
      "objects",
    );
  }),
);
await Database.release(db);

console.log("Reset completed");
