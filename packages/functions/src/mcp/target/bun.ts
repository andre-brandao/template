import { bun } from "../../target";
import { Database } from "@template/core/drizzle";
import { Kv } from "@template/core/kv";
import { redis } from "@template/core/kv/adapter/redis";
import { Queue } from "@template/core/queue";
import { app } from "../index";

const port = parseInt(process.env.MCP_PORT!) || 3001;
console.log(`MCP running at http://localhost:${port}/mcp`);

// Tools mutate todos and projects, and every published event pushes a delivery job.
export default bun(
  app,
  port,
  Queue.provider(Queue.fromEnv(process.env, Database.use)),
  Kv.provider(Kv.fromEnv(process.env, Database.use, { redis })),
);
