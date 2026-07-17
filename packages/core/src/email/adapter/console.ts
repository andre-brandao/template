import type { Email } from "../index";
import { Log } from "../../util/log";

const log = Log.create({ namespace: "email.console" });

/** Logs the email instead of sending it. For local dev and self-host without SMTP. */
export function createConsoleSender(): Email.SenderPort {
  return {
    async send({ from, to, subject, body }) {
      log.info("email", { from, to, subject });
      console.log(`\n──── email → ${to}\n${subject}\n\n${body}\n────\n`);
    },
  };
}
