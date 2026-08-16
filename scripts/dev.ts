#!/usr/bin/env bun

import { boxed } from "./utils/box";
import { paint } from "./utils/color";

const root = `${import.meta.dir}/..`;
const decoder = new TextDecoder();
const children = new Set<ReturnType<typeof Bun.spawn>>();
type IO = "pipe" | "inherit" | "ignore";

// DB=docker runs postgres from infra/docker/compose.yml instead of in-process pglite
const driver = process.env.DB ?? "docker";
if (driver !== "pglite" && driver !== "docker") throw new Error(`Unknown DB: ${driver}`);

// RESET=1 (or --reset) wipes the persisted schema before pushing; pglite is in-memory
// and already starts empty, so it only matters for docker's pgdata volume.
const reset = process.env.RESET === "1" || process.argv.includes("--reset");

const pgport = Number(process.env.PGPORT ?? 5432);
const url =
  process.env.DATABASE_URL ?? `postgresql://postgres:password@127.0.0.1:${pgport}/postgres`;
const authport = Number(process.env.AUTH_PORT ?? 3002);
const env = {
  ...process.env,
  DATABASE_URL: url,
  PGPORT: String(pgport),
  // pglite's socket server accepts exactly one connection; docker postgres pools. The
  // one connection also has to travel between processes, so bun targets close it per request.
  PG_MAX: process.env.PG_MAX ?? (driver === "pglite" ? "1" : "10"),
  PG_RELEASE: process.env.PG_RELEASE ?? String(driver === "pglite"),
  AUTH_URL: process.env.AUTH_URL ?? `http://localhost:${authport}`,
  // `db` so pushes land in the job table for the queue worker; `sync` would run them inline.
  QUEUE_DRIVER: process.env.QUEUE_DRIVER ?? "db",
};

const apiport = Number(process.env.API_PORT ?? 3000);
const mcpport = Number(process.env.MCP_PORT ?? 3001);
const webport = Number(process.env.WEB_PORT ?? 5173);

// docker's postgres is a container, not a child, so its port never leaks here
const ports = [webport, apiport, mcpport, authport, ...(driver === "pglite" ? [pgport] : [])];

// The file, not the package script: `bun run <script>` forks a grandchild, and `stop`
// only ever sees the wrapper — the orphan then keeps its port and database pool for good.
const servers = [
  {
    name: "api",
    cwd: `${root}/packages/functions`,
    cmd: ["bun", "run", "--hot", "src/api/target/bun.ts"],
    env: { API_PORT: String(apiport) },
    color: paint.cyan,
  },
  {
    name: "mcp",
    cwd: `${root}/packages/functions`,
    cmd: ["bun", "run", "--hot", "src/mcp/target/bun.ts"],
    env: { MCP_PORT: String(mcpport) },
    color: paint.magenta,
  },
  {
    name: "auth",
    cwd: `${root}/packages/functions`,
    cmd: ["bun", "run", "--hot", "src/auth/target/bun.ts"],
    env: { PORT: String(authport) },
    color: paint.blue,
  },
  {
    name: "queue",
    cwd: `${root}/packages/functions`,
    cmd: ["bun", "run", "--hot", "src/queue/target/bun.ts"],
    env: {},
    color: paint.red,
  },
  {
    name: "web",
    cwd: `${root}/apps/dashboard`,
    // strictPort so a clash is loud instead of silently drifting to another port
    cmd: ["bun", "--bun", "run", "dev", "--port", String(webport), "--strictPort"],
    env: {},
    color: paint.yellow,
  },
] as const;

function spawn(
  cmd: readonly string[],
  cwd: string,
  out: IO = "inherit",
  err: IO = out,
  extra?: object,
) {
  const child = Bun.spawn([...cmd], {
    cwd,
    env: extra ? { ...env, ...extra } : env,
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

// SIGTERM is advisory once a child installs its own handler, so escalate. One child
// that ignores it would otherwise keep `stop` pending and leak the whole stack.
async function stop() {
  await Promise.all(
    [...children].map(async (child) => {
      child.kill();
      const timer = setTimeout(() => child.kill("SIGKILL"), 3000);
      await child.exited;
      clearTimeout(timer);
    }),
  );
}

// A second Ctrl-C bails out instead of queueing another stop behind a stuck one.
let stopping = false;
async function bye() {
  if (stopping) {
    console.log(paint.red("\nForced exit — surviving children keep their ports and db pool."));
    const pids = [...children].map((child) => child.pid);
    if (pids.length) console.log(`  kill -9 ${pids.join(" ")}`);
    // web forks vite through its package script, so a grandchild can outlive the pids above
    console.log(`  lsof -ti ${ports.map((port) => `:${port}`).join(" ")} | xargs -r kill -9`);
    process.exit(1);
  }
  stopping = true;
  console.log("\nStopping... press Ctrl-C again to force.");
  await stop();
  process.exit(0);
}

process.on("SIGINT", bye);
process.on("SIGTERM", bye);

// In-process postgres; dies with this script, so migrations run on every start.
async function pglite() {
  const db = spawn(["bun", "pglite.ts"], import.meta.dir, "pipe", "ignore");
  const out = db.stdout;
  if (!(out instanceof ReadableStream)) throw new Error("Database stdout unavailable");
  await new Promise<void>((resolve, reject) => {
    void pipe(out, `${paint.green("db ")} │ `, resolve);
    db.exited.then((code) => {
      if (code !== 0) reject(new Error(`Database exited with code ${code}`));
    });
  });
}

// Reuses the postgres service (and its pgdata volume) from the deploy stack. Left
// running on exit so the next start is instant — `bun docker:down` stops it.
async function docker() {
  const up = spawn(
    [
      "docker",
      "compose",
      "-f",
      `${root}/infra/docker/compose.yml`,
      "up",
      "-d",
      "--wait",
      "postgres",
    ],
    root,
  );
  if ((await up.exited) !== 0) throw new Error("Failed to start the postgres container");
  if (reset) {
    console.log("Resetting database...");
    const wipe = spawn(["bun", "reset.ts"], import.meta.dir);
    if ((await wipe.exited) !== 0) throw new Error("Failed to reset the database");
  }
  // --force: the volume persists across runs, so drift would otherwise stop on a TTY prompt
  const push = spawn(["bun", "run", "db:push", "--force"], `${root}/packages/core`);
  if ((await push.exited) !== 0) throw new Error("Failed to push the schema");
}

console.log(`Starting database (${driver}) on ${pgport}...`);
await (driver === "docker" ? docker() : pglite());

console.log("Seeding database...");
const seed = spawn(["bun", "seed.ts"], import.meta.dir);
const code = await seed.exited;
if (code !== 0) {
  await stop();
  process.exit(code);
}

const separatorWidth = Math.max(...servers.map((server) => server.name.length));

console.log(
  boxed([
    "STACK RUNNING",
    "",
    `web    http://localhost:${webport}`,
    `api    http://localhost:${apiport}`,
    `mcp    http://localhost:${mcpport}/mcp`,
    `auth   http://localhost:${authport}`,
    "queue  worker, no http",
  ]),
);

const exit = await Promise.race(
  servers.map((server) => {
    const child = spawn(server.cmd, server.cwd, "pipe", "pipe", server.env);
    const tag = `${server.color(server.name.padEnd(separatorWidth))} │ `;
    for (const stream of [child.stdout, child.stderr]) {
      if (stream instanceof ReadableStream) void pipe(stream, tag);
    }
    return child.exited;
  }),
);

await stop();
process.exit(exit);
