#!/usr/bin/env bun

import { Database, sql } from "@template/core/drizzle";

// Drops every table/type in the database so the next db:push rebuilds from scratch.
const db = Database.connect();

await Database.provide(db, () =>
  Database.use((tx) =>
    tx.execute(sql`drop schema public cascade; create schema public;`, "objects"),
  ),
);
await Database.release(db);

console.log("Reset completed");
