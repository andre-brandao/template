import { Identity } from "./identity";
import { Email } from "./lib/email";
import { Queue } from "./lib/queue";
import { Auth } from "./auth";
import { Bus } from "./platform/bus";
import { Webhook } from "./platform/webhook";

/** Every job in one import, so a worker process resolves all handlers. Push via `jobs.email.push`. */
export const email = Email.job;
export const webhook = Webhook.job;
export const bus = Bus.job;
export { subscribers } from "./subscribers";

/**
 * Runs one job as whoever pushed it; nobody pushed it → `public`, least privilege. The role is
 * re-read off the row, so a job can't outlive a demotion. Lives in the barrel on purpose:
 * importing `run` drags every handler definition into the process.
 */
export async function run(job: Queue.Job) {
  const stamp = Identity.Stamp.nullable().catch(null).parse(job.identity);
  if (!stamp) return Identity.provide("public", {}, () => Queue.run(job));
  // The app's own code: nobody to re-read, so its name and grants are all it is.
  if (stamp.type === "internal")
    return Identity.internal(stamp.name ?? "app", stamp.scope ?? {}, () => Queue.run(job));
  return Identity.enter(await Auth.identify(stamp.userID!, stamp), () => Queue.run(job));
}
