import { Hono } from "hono";
import { handle, streamHandle } from "hono/aws-lambda";
import { Database } from "@template/core/drizzle";
import { providers } from "../../providers";
import { app } from "../routes";

const aws = new Hono()
  .use(providers(Database.provider(process.env.DATABASE_URL ?? Database.DEFAULT_URL)))
  .route("/", app);

// sst dev's live lambda doesn't support response streaming.
export const handler = process.env.SST_LIVE ? handle(aws) : streamHandle(aws);
