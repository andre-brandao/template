import { Actor } from "./actor";
import { found } from "./error";
import { Queue } from "./lib/queue";
import { User } from "./user";

/**
 * Jobs are defined next to the module that pushes them; importing them here gives a
 * process running `Queue.work()` one module to import for every handler to resolve.
 * Push with `jobs.email.push({ ... })`.
 */
export { job as email } from "./email/adapter/queue";

/**
 * Runs one job as its pushing actor — what the worker targets hand to `Queue.work` and
 * the Cloudflare consumer. Living in the barrel is deliberate: importing `run` drags
 * every handler definition into the process with it.
 *
 * No pusher means the app itself queued the job, so it runs unchecked. A pushed job
 * replays as its user, at whatever role that user holds *now*.
 */
export async function run(job: Queue.Job) {
  if (!job.userID) return Actor.provide("system", {}, () => Queue.run(job));
  const row = found("User", await User.fromID(job.userID));
  return Actor.provide("user", { userID: job.userID, role: row.role }, () => Queue.run(job));
}
