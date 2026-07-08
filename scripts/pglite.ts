#!/usr/bin/env bun

import { $ } from "bun";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
// import { drizzle } from 'drizzle-orm/pglite'

const MIGRATION_PATH = `${import.meta.dir}/../packages/core`;
const PORT = 5432;
const HOST = "127.0.0.1";

const db = await PGlite.create({
  // dataDir: "/tmp/pglite/hono"
});

const server = new PGLiteSocketServer({
  db,
  port: PORT,
  host: HOST,
});
await server.start();

console.log(`Running migrations...`);

await $`bun run db:push`.cwd(MIGRATION_PATH).quiet();

console.log(`Migrations completed.`);

console.log(`Server started on ${HOST}:${PORT}`);

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Stopping server...");
  await server.stop();
  await db.close();

  console.log("Server stopped and database closed");
  process.exit(0);
});
