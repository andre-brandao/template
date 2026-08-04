#!/usr/bin/env bun

const root = `${import.meta.dir}/..`;
const decoder = new TextDecoder();
const children = new Set<ReturnType<typeof Bun.spawn>>();
type IO = "pipe" | "inherit" | "ignore";

// DB=docker runs postgres from infra/docker/compose.yml instead of in-process pglite
const driver = process.env.DB ?? "docker";
if (driver !== "pglite" && driver !== "docker") throw new Error(`Unknown DB: ${driver}`);

const pgport = Number(process.env.PGPORT ?? 5432);
const url =
  process.env.DATABASE_URL ?? `postgresql://postgres:password@127.0.0.1:${pgport}/postgres`;
const authport = Number(process.env.AUTH_PORT ?? 3002);
const env = {
  ...process.env,
  DATABASE_URL: url,
  PGPORT: String(pgport),
  AUTH_URL: process.env.AUTH_URL ?? `http://localhost:${authport}`,
  SESSION_SECRET: process.env.SESSION_SECRET ?? "dev-session-secret",
};

const servers = [
  {
    name: "api",
    cwd: `${root}/packages/functions`,
    cmd: ["bun", "run", "dev"],
    port: Number(process.env.PORT ?? 3000),
    env: (port: number) => ({ PORT: String(port) }),
    color: "\x1b[36m",
  },
  {
    name: "mcp",
    cwd: `${root}/packages/functions`,
    cmd: ["bun", "run", "dev:mcp"],
    port: Number(process.env.MCP_PORT ?? 3001),
    env: (port: number) => ({ MCP_PORT: String(port) }),
    color: "\x1b[35m",
  },
  {
    name: "auth",
    cwd: `${root}/packages/functions`,
    cmd: ["bun", "run", "dev:auth"],
    port: authport,
    env: (port: number) => ({ PORT: String(port) }),
    color: "\x1b[34m",
  },
  {
    name: "web",
    cwd: `${root}/apps/dashboard`,
    // strictPort so a clash is loud instead of silently drifting to another port
    cmd: (port: number) => ["bun", "run", "dev", "--port", String(port), "--strictPort"],
    port: Number(process.env.WEB_PORT ?? 5173),
    color: "\x1b[33m",
  },
];

function spawn(cmd: string[], cwd: string, out: IO = "inherit", err: IO = out, extra?: object) {
  const child = Bun.spawn(cmd, {
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

// In-process postgres; dies with this script, so migrations run on every start.
async function pglite() {
  const db = spawn(["bun", "pglite.ts"], import.meta.dir, "pipe", "ignore");
  const out = db.stdout;
  if (!(out instanceof ReadableStream)) throw new Error("Database stdout unavailable");
  await new Promise<void>((resolve, reject) => {
    void pipe(out, "\x1b[32mdb \x1b[0m │ ", resolve);
    db.exited.then((code) => {
      if (code !== 0) reject(new Error(`Database exited with code ${code}`));
    });
  });
}

// Reuses the postgres service (and its pgdata volume) from the deploy stack. Left
// running on exit so the next start is instant — `bun docker:down` stops it.
async function docker() {
  const up = spawn(
    ["docker", "compose", "-f", `${root}/infra/docker/compose.yml`, "up", "-d", "--wait", "postgres"],
    root,
  );
  if ((await up.exited) !== 0) throw new Error("Failed to start the postgres container");
  // --force: the volume persists across runs, so drift would otherwise stop on a TTY prompt
  const push = spawn(["bun", "run", "db:push", "--force"], `${root}/packages/core`);
  if ((await push.exited) !== 0) throw new Error("Failed to push the schema");
}

console.log(`Starting database (${driver}) on ${pgport}...`);
await(driver === "docker" ? docker() : pglite());

console.log("Seeding database...");
const seed = spawn(["bun", "seed.ts"], import.meta.dir);
const code = await seed.exited;
if (code !== 0) {
  await stop();
  process.exit(code);
}

const separatorWidth = Math.max(...servers.map((server) => server.name.length));

console.log(`Starting servers... ${servers.map((s) => `${s.name}=${s.port}`).join(" ")}`);
const exit = await Promise.race(
  servers.map((server) => {
    const cmd = typeof server.cmd === "function" ? server.cmd(server.port) : server.cmd;
    const child = spawn(cmd, server.cwd, "pipe", "pipe", server.env?.(server.port));
    const tag = `${server.color}${server.name.padEnd(separatorWidth)}\x1b[0m │ `;
    for (const stream of [child.stdout, child.stderr]) {
      if (stream instanceof ReadableStream) void pipe(stream, tag);
    }
    return child.exited;
  }),
);

await stop();
process.exit(exit);
