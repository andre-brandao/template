import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Central } from "@template/core/drizzle/central";
import { Kv } from "@template/core/kv";
import { redis } from "@template/core/kv/adapter/redis";
import { Queue } from "@template/core/queue";
import { Storage } from "@template/core/storage";
import { app as apiApp } from "@template/functions/api";
import { app as mcpApp } from "@template/functions/mcp";
import { createAuth } from "@template/functions/auth";

const dash = `${import.meta.dir}/../../dashboard`;
const db = Database.connect();

type Res = Response | Promise<Response>;

/** One pool for the process, plus the providers the matching `functions` bun target wires. */
function serveApp(
  app: { fetch: (req: Request) => Res },
  port: number,
  ...extra: Context.Provider<Res>[]
) {
  Bun.serve({
    port,
    fetch: (req) => Context.withProviders(() => app.fetch(req), Database.provider(db), ...extra),
  });
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
    const port = Number(process.env.API_PORT) || 3000;
    serveApp(
      apiApp,
      port,
      Storage.provider(Storage.fromEnv(process.env)),
      Queue.provider(Queue.fromEnv(process.env, Central.use)),
      Kv.provider(Kv.fromEnv(process.env, Central.use, { redis })),
    );
    console.log(`API running at http://localhost:${port}`);
  },
  mcp: () => {
    const port = Number(process.env.MCP_PORT) || 3001;
    serveApp(
      mcpApp,
      port,
      Queue.provider(Queue.fromEnv(process.env, Central.use)),
      Kv.provider(Kv.fromEnv(process.env, Central.use, { redis })),
    );
    console.log(`MCP running at http://localhost:${port}/mcp`);
  },
  auth: () => {
    const port = Number(process.env.PORT) || 3002;
    // The issuer holds no app state, so like `auth/target/bun.ts` it serves bare.
    const app = createAuth(MemoryStorage({ persist: process.env.AUTH_PERSIST }));
    Bun.serve({ port, fetch: (req) => app.fetch(req) });
    console.log(`Auth running at http://localhost:${port}`);
  },
  dashboard,
};

export async function serve(rest: string[]) {
  return (targets[rest[0]!] ?? usage)();
}
