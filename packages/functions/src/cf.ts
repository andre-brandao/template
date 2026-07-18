import type { Hyperdrive, KVNamespace } from "@cloudflare/workers-types";

/** Bindings shared by every Cloudflare worker target. */
export interface Env {
  Hyperdrive: Hyperdrive;
}

/** Auth worker extras: OpenAuth storage KV and the email service binding. */
export interface AuthEnv extends Env {
  AuthKv: KVNamespace;
  SEND_EMAIL: { send(message: Record<string, unknown>): Promise<unknown> };
}
