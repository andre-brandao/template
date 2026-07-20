import { Actor } from "@template/core/actor";
import { Template } from "@template/core/email/template";
import { User } from "@template/core/user";
import { Log } from "@template/core/util/log";

const log = Log.create({ namespace: "cron" });

const DAY = 86_400_000;

/** The 7 days ending yesterday — a Monday run covers Mon–Sun of the prior week. */
export function week(now = Date.now()) {
  return {
    start: new Date(now - 7 * DAY).toISOString().slice(0, 10),
    end: new Date(now - DAY).toISOString().slice(0, 10),
  };
}

export async function weekly() {
  const range = week();
  const users = await User.list();
  // Sequential on purpose: the postgres client pools a single connection.
  for (const user of users) {
    await Actor.provide("user", { userID: user.id }, () =>
      Template.sendWeeklyInsights(range),
    ).catch((err) => log.warn("weekly insights failed", { userID: user.id, err: String(err) }));
  }
}
