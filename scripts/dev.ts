#!/usr/bin/env bun

import { Database } from "@template/core/drizzle";

const root = `${import.meta.dir}/..`;
const app = `${root}/apps/dashboard`;
const url = process.env.DATABASE_URL ?? Database.DEFAULT_URL;
const env = { ...process.env, DATABASE_URL: url };
const decoder = new TextDecoder();
const children = new Set<ReturnType<typeof Bun.spawn>>();
type IO = "pipe" | "inherit" | "ignore";

function spawn(cmd: string[], cwd: string, out: IO = "inherit", err: IO = out) {
  const child = Bun.spawn(cmd, {
    cwd,
    env,
    stdin: "inherit",
    stdout: out,
    stderr: err,
  });
  children.add(child);
  child.exited.finally(() => children.delete(child));
  return child;
}

async function pipe(stream: ReadableStream<Uint8Array>, ready: () => void) {
  for await (const chunk of stream) {
    const text = decoder.decode(chunk);
    process.stdout.write(text);
    if (text.includes("Server started")) ready();
  }
}

async function stop() {
  await Promise.all(
    [...children].map(async (child) => {
      child.kill();
      await child.exited;
    }),
  );
}

process.on("SIGINT", async () => {
  await stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stop();
  process.exit(0);
});

console.log("Starting database...");
const db = spawn(["bun", "pglite.ts"], import.meta.dir, "pipe", "ignore");
const stdout = db.stdout;
if (!stdout) throw new Error("Database stdout unavailable");

await new Promise<void>((resolve, reject) => {
  void pipe(stdout, resolve);
  db.exited.then((code) => {
    if (code !== 0) reject(new Error(`Database exited with code ${code}`));
  });
});

console.log("Seeding database...");
const seed = spawn(["bun", "seed.ts"], import.meta.dir);
const code = await seed.exited;
if (code !== 0) {
  await stop();
  process.exit(code);
}

console.log("Starting dashboard...");
const dashboard = spawn(["bun", "run", "dev"], app);
const exit = await dashboard.exited;
await stop();
process.exit(exit);
