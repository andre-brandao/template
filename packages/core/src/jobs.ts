import { Identity } from "./identity";
import { Email } from "./lib/email";
import { Queue } from "./lib/queue";
import { User } from "./user";
import { zone } from "./user/prefs";
import { Bus } from "./platform/bus";
import { Webhook } from "./platform/webhook";

/** Every job in one import, so a worker process resolves all handlers. Push via `jobs.email.push`. */
export const email = Email.job;
export const webhook = Webhook.job;
export const bus = Bus.job;
export { subscribers } from "./subscribers";

/**
 * Runs one job as whoever pushed it (no pusher → system). The role is re-read off the row,
 * so a job can't outlive a demotion. Lives in the barrel on purpose: importing `run` drags
 * every handler definition into the process.
 */
export async function run(job: Queue.Job) {
  const stamp = Identity.Stamp.nullable().catch(null).parse(job.identity);
  if (!stamp) return Identity.provide("system", {}, () => Queue.run(job));
  const row = await User.assert.exists(User.fromID(stamp.userID));
  const base = { userID: stamp.userID, role: row.role };
  if (stamp.type === "bot") return Identity.provide("bot", base, () => Queue.run(job));
  const timezone = zone(row.prefs);
  if (stamp.type === "agent")
    return Identity.provide(
      "agent",
      { ...base, timezone, name: stamp.name ?? "agent", scope: stamp.scope },
      () => Queue.run(job),
    );
  return Identity.provide("user", { ...base, timezone }, () => Queue.run(job));
}
