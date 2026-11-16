import { lambda } from "../../target";
import { Central } from "@template/core/drizzle/central";
import { Queue } from "@template/core/queue";
import { app } from "../index";

export const handler = lambda(app, Queue.provider(Queue.fromEnv(process.env, Central.use)));
