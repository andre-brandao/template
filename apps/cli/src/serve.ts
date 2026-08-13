import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { app as apiApp } from "@template/functions/api";
import { app as mcpApp } from "@template/functions/mcp";
import { createAuth } from "@template/functions/auth";

const dash = `${import.meta.dir}/../../dashboard`;
const db = Database.create();

/**
 * One pool for the process, mirroring the dashboard's `hooks.server.ts`. Dev backends
 * like pglite accept only a single active connection, so a client per request can't
 * run against them.
 */
function serveApp(app: { fetch: (req: Request) => Response | Promise<Response> }, port: number) {
  Bun.serve({ port, fetch: (req) => Database.provide(db, () => app.fetch(req)) });
}

function forward(child: Bun.Subprocess) {
  const kill = () => child.kill();
  process.on("SIGINT", kill);
  process.on("SIGTERM", kill);
  return child.exited;
}

async function dashboard() {
  const entry = `${dash}/build/index.js`;
  if (!(await Bun.file(entry).exists())) {
    console.log("Building dashboard...");
    const build = Bun.spawn(["bun", "run", "build"], {
      cwd: dash,
      stdio: ["inherit", "inherit", "inherit"],
    });
    const code = await build.exited;
    if (code !== 0) process.exit(code);
  }
  const port = process.env.PORT ?? "3000";
  console.log(`Dashboard running at http://localhost:${port}`);
  const child = Bun.spawn(["bun", entry], {
    cwd: dash,
    env: { ...process.env, PORT: port },
    stdio: ["inherit", "inherit", "inherit"],
  });
  process.exit(await forward(child));
}

function usage() {
  console.error("Usage: template-cli serve <api|mcp|auth|dashboard>");
  process.exit(1);
}

const targets: Record<string, () => void | Promise<void>> = {
  api: () => {
    const port = Number(process.env.PORT) || 3000;
    serveApp(apiApp, port);
    console.log(`API running at http://localhost:${port}`);
  },
  mcp: () => {
    const port = Number(process.env.MCP_PORT) || 3001;
    serveApp(mcpApp, port);
    console.log(`MCP running at http://localhost:${port}/mcp`);
  },
  auth: () => {
    const port = Number(process.env.PORT) || 3002;
    const app = createAuth(MemoryStorage({ persist: process.env.AUTH_PERSIST }));
    const sender = Email.fromEnv(process.env);
    Bun.serve({
      port,
      fetch: (req) => Database.provide(db, () => Email.provide(sender, () => app.fetch(req))),
    });
    console.log(`Auth running at http://localhost:${port}`);
  },
  dashboard,
};

export async function serve(rest: string[]) {
  return (targets[rest[0]!] ?? usage)();
}
