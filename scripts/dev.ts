#!/usr/bin/env bun

const root = `${import.meta.dir}/..`;
const decoder = new TextDecoder();
const children = new Set<ReturnType<typeof Bun.spawn>>();
type IO = "pipe" | "inherit" | "ignore";

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

console.log(`Starting database on ${pgport}...`);
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
