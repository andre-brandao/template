#!/usr/bin/env bun

import { Database } from "@template/core/drizzle";

const root = `${import.meta.dir}/..`;
const url = process.env.DATABASE_URL ?? Database.DEFAULT_URL;
const env = { ...process.env, DATABASE_URL: url };
const decoder = new TextDecoder();
const children = new Set<ReturnType<typeof Bun.spawn>>();
type IO = "pipe" | "inherit" | "ignore";

const servers = [
  { name: "api", cwd: `${root}/packages/functions`, cmd: ["bun", "run", "dev"], color: "\x1b[36m" },
  {
    name: "mcp",
    cwd: `${root}/packages/functions`,
    cmd: ["bun", "run", "dev:mcp"],
    color: "\x1b[35m",
  },
  { name: "web", cwd: `${root}/apps/dashboard`, cmd: ["bun", "run", "dev"], color: "\x1b[33m" },
];

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

async function pipe(stream: ReadableStream<Uint8Array>, tag: string, ready?: () => void) {
  for await (const chunk of stream) {
    const text = decoder.decode(chunk);
    for (const line of text.split("\n")) {
      if (line) process.stdout.write(`${tag}${line}\n`);
    }
    if (text.includes("Server started")) ready?.();
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
if (!(stdout instanceof ReadableStream)) throw new Error("Database stdout unavailable");

await new Promise<void>((resolve, reject) => {
  void pipe(stdout, "\x1b[32mdb \x1b[0m │ ", resolve);
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

console.log("Starting servers...");
const exit = await Promise.race(
  servers.map((server) => {
    const child = spawn(server.cmd, server.cwd, "pipe");
    const tag = `${server.color}${server.name.padEnd(3)}\x1b[0m │ `;
    for (const stream of [child.stdout, child.stderr]) {
      if (stream instanceof ReadableStream) void pipe(stream, tag);
    }
    return child.exited;
  }),
);

await stop();
process.exit(exit);
