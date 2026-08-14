#!/usr/bin/env bun

import { $ } from "bun";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const root = `${import.meta.dir}/../packages/core`;
const host = "127.0.0.1";

/** Asks the OS for an unused port. */
function free() {
  const probe = Bun.serve({ port: 0, fetch: () => new Response() });
  const port = probe.port;
  probe.stop(true);
  return port;
}

function pick() {
  if (process.env.PGPORT) return Number(process.env.PGPORT);
  if (process.env.DATABASE_URL) return Number(new URL(process.env.DATABASE_URL).port || 5432);
  // bun sets NODE_ENV=test; give each test run its own db so it can't collide with a running dev server
  if (process.env.NODE_ENV === "test") return free();
  return 5432;
}

const port = pick();

// db:push (drizzle-kit) and anything importing Database read this
process.env.DATABASE_URL ??= `postgresql://postgres:password@${host}:${port}/postgres`;
// Mutations push webhook jobs, and the `db` default needs a runner no test wires up.
// Tests that care drive the queue themselves through `Queue.provide`.
process.env.QUEUE_DRIVER ??= "memory";
// The socket server accepts exactly one connection, so the pool must not grow.
process.env.PG_MAX = "1";

const db = await PGlite.create({
  // dataDir: "/tmp/pglite/hono"
});

const server = new PGLiteSocketServer({
  db,
  port,
  host,
});
await server.start();

console.log(`Running migrations...`);

await $`bun run db:push`.cwd(root).quiet();

console.log(`Migrations completed.`);

console.log(`Server started on ${host}:${port}`);

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Stopping server...");
  await server.stop();
  await db.close();

  console.log("Server stopped and database closed");
  process.exit(0);
});
