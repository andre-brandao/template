import { lambda } from "../../target";
import { Database } from "@template/core/drizzle";
import { Queue } from "@template/core/queue";
import { app } from "../index";

export const handler = lambda(app, Queue.provider(Queue.fromEnv(process.env, Database.use)));
