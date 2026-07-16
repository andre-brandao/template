import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Database, sql } from "@template/core/drizzle";

// e2e runs against a real Postgres (the app's actual dev DB), not pglite — its
// socket server is single-connection and can't serve the app plus parallel test
// workers at once. We isolate on a dedicated database and reset it each run, so
// a developer's dev data (in `postgres`) is never touched.
const base = process.env.E2E_PG ?? "postgresql://postgres:password@127.0.0.1:5432";
const db = process.env.E2E_DB ?? "template_e2e";
const url = `${base}/${db}`;
const dir = fileURLToPath(new URL("../../../../packages/core/migrations", import.meta.url));

export default async function () {
  await ensure();
  await Database.provide(url, async () => {
    await run(sql`drop schema public cascade`);
    await run(sql`create schema public`);
    for (const stmt of statements()) await run(sql.raw(stmt));
  });
}

/** Create the dedicated e2e database if it isn't there yet (CREATE DATABASE can't be conditional). */
function ensure() {
  return Database.provide(`${base}/postgres`, () =>
    Database.use(async (tx) => {
      const rows = await tx.execute(sql`select 1 from pg_database where datname = ${db}`);
      // @ts-expect-error it works
      if (rows.length === 0) await tx.execute(sql.raw(`create database "${db}"`));
    }),
  );
}

const run = (q: ReturnType<typeof sql.raw>) => Database.use((tx) => tx.execute(q));

function statements() {
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .flatMap((d) =>
      readFileSync(`${dir}/${d.name}/migration.sql`, "utf8").split("--> statement-breakpoint"),
    )
    .map((s) => s.trim())
    .filter(Boolean);
}
