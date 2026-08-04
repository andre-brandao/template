#!/usr/bin/env bun

import { Database, sql } from "@template/core/drizzle";

// Drops every table/type in the database so the next db:push rebuilds from scratch.
const url = process.env.DATABASE_URL ?? Database.DEFAULT_URL;

await Database.provide(url, () =>
  Database.use((tx) => tx.execute(sql`drop schema public cascade; create schema public;`)),
);
await Database.release(url);

console.log("Reset completed");
