import { lambda } from "../../target";
import { Database } from "@template/core/drizzle";
import { Queue } from "@template/core/queue";
import { Storage } from "@template/core/storage";
import { app } from "../routes";

export const handler = lambda(
  app,
  Storage.provider(Storage.fromEnv(process.env)),
  Queue.provider(Queue.fromEnv(process.env, Database.use)),
);
