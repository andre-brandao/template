import type {
  Hyperdrive,
  KVNamespace,
  Queue,
  R2Bucket,
  SendEmail,
} from "@cloudflare/workers-types";
import type { Job } from "@template/core/queue/port";

/** Bindings shared by every Cloudflare worker target. */
export interface Env {
  Hyperdrive: Hyperdrive;
  Files: R2Bucket;
}

/** Workers that push jobs — the api and the consumer, for follow-up jobs. */
export interface QueueEnv extends Env {
  Jobs: Queue<Job>;
}

/** Workers that send mail themselves — the auth flows and the job consumer. */
export interface EmailEnv extends Env {
  SEND_EMAIL: SendEmail;
}

/** Auth worker extra: OpenAuth's storage KV. */
export interface AuthEnv extends EmailEnv {
  AuthKv: KVNamespace;
}
