import type { Hyperdrive, KVNamespace, R2Bucket, SendEmail } from "@cloudflare/workers-types";

/** Bindings shared by every Cloudflare worker target. */
export interface Env {
  Hyperdrive: Hyperdrive;
  Files: R2Bucket;
}

/** Auth worker extras: OpenAuth storage KV and the email service binding. */
export interface AuthEnv extends Env {
  AuthKv: KVNamespace;
  SEND_EMAIL: SendEmail;
}

/** Cron worker: db plus the email service binding. */
export interface CronEnv {
  Hyperdrive: Hyperdrive;
  SEND_EMAIL: SendEmail;
}
