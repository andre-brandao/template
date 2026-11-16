import { lambda } from "../../target";
import { Central } from "@template/core/drizzle/central";
import { Queue } from "@template/core/queue";
import { Storage } from "@template/core/storage";
import { app } from "../routes";

export const handler = lambda(
  app,
  Storage.provider(Storage.fromEnv(process.env)),
  Queue.provider(Queue.fromEnv(process.env, Central.use)),
);
