import { Database } from "@template/core/drizzle";
import { app as apiApp } from "@template/functions/api";
import { app as mcpApp } from "@template/functions/mcp";

const dash = `${import.meta.dir}/../../dashboard`;
const url = process.env.DATABASE_URL ?? Database.DEFAULT_URL;

/**
 * Reuse one DB connection per request, mirroring the dashboard's `hooks.server.ts`.
 * Dev backends like pglite accept only a single active connection, so the raw API
 * app (which opens a fresh client per request) can't run against them without this.
 */
function serveApp(app: { fetch: (req: Request) => Response | Promise<Response> }, port: number) {
  Bun.serve({ port, fetch: (req) => Database.provide(url, () => app.fetch(req)) });
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
  console.error("Usage: template-cli serve <api|mcp|dashboard>");
  process.exit(1);
}

export async function serve(rest: string[]) {
  const target = rest[0];

  if (target === "api") {
    const port = Number(process.env.PORT) || 3000;
    serveApp(apiApp, port);
    console.log(`API running at http://localhost:${port}`);
    return;
  }

  if (target === "mcp") {
    const port = Number(process.env.MCP_PORT) || 3001;
    serveApp(mcpApp, port);
    console.log(`MCP running at http://localhost:${port}/mcp`);
    return;
  }

  if (target === "dashboard") return dashboard();

  usage();
}
