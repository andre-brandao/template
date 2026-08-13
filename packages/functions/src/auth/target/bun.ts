import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
import { Actor } from "@template/core/actor";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { Queue } from "@template/core/queue";
import { bun } from "../../target";
import { createAuth } from "../index";

const port = Number(process.env.PORT ?? 3002);
console.log(`Auth running at http://localhost:${port}`);

export default bun(
  createAuth(MemoryStorage({ persist: process.env.AUTH_PERSIST })),
  port,
  Queue.provider(Queue.fromEnv(process.env, Database.use)),
  Email.provider(Email.Providers.queue()),
  // Login codes go out pre-auth, and the queue driver records who pushed.
  (fn) => Actor.provide("public", {}, fn),
);
