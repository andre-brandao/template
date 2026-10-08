import * as Cloudflare from "alchemy/Cloudflare";

export const Files = Cloudflare.R2.Bucket("Files");

export const AuthKv = Cloudflare.KV.Namespace("AuthKv");

// Retries and burial live on the consumer, not in the driver — QUEUE_RETRIES/QUEUE_BACKOFF
// don't apply on Cloudflare.
export const Jobs = Cloudflare.Queues.Queue("Jobs");

export const Dlq = Cloudflare.Queues.Queue("JobsDlq");

// Binding-only: no cloud resource is created.
export const Email = Cloudflare.Email.SendEmail("Email");
