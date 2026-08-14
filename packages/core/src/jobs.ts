import { Actor } from "./actor";
import { found } from "./error";
import { Email } from "./lib/email";
import { Queue } from "./lib/queue";
import { User } from "./user";
import { Webhook } from "./webhook";

/** Every job in one import, so a worker process resolves all handlers. Push via `jobs.email.push`. */
export const email = Email.job;
export const webhook = Webhook.job;

/**
 * Runs one job as its pushing actor (no pusher → system). Lives in the barrel on
 * purpose: importing `run` drags every handler definition into the process.
 */
export async function run(job: Queue.Job) {
  if (!job.userID) return Actor.provide("system", {}, () => Queue.run(job));
  const row = found("User", await User.fromID(job.userID));
  return Actor.provide("user", { userID: job.userID, role: row.role }, () => Queue.run(job));
}
