import type { ScheduledController } from "@cloudflare/workers-types";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { createCloudflareSender } from "@template/core/email/adapter/cloudflare";
import type { CronEnv } from "../../cf";
import { weekly } from "../index";

export default {
  async scheduled(_: ScheduledController, env: CronEnv) {
    await Context.withProviders(
      weekly,
      Database.provider(env.Hyperdrive.connectionString),
      Email.provider(createCloudflareSender(env.SEND_EMAIL)),
    );
  },
};
