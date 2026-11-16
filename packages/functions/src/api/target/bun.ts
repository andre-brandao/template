import { bun } from "../../target";
import { Central } from "@template/core/drizzle/central";
import { Kv } from "@template/core/kv";
import { redis } from "@template/core/kv/adapter/redis";
import { Queue } from "@template/core/queue";
import { Storage } from "@template/core/storage";
import { app } from "../routes";

const port = parseInt(process.env.API_PORT!) || 3000;
console.log(`Running at http://localhost:${port}`);

export default bun(
  app,
  port,
  Storage.provider(Storage.fromEnv(process.env)),
  Queue.provider(Queue.fromEnv(process.env, Central.use)),
  Kv.provider(Kv.fromEnv(process.env, Central.use, { redis })),
);
