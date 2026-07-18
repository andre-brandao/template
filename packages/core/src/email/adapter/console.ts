import type { Email } from "../index";
import { Log } from "../../util/log";

const log = Log.create({ namespace: "email.console" });

function boxedEmail({
  from,
  to,
  subject,
  body,
}: {
  from?: string;
  to: string | string[];
  subject: string;
  body: string;
}): string {
  const lines = [
    "📧 CONSOLE EMAIL",
    "",
    `From: ${from ?? "(not set)"}`,
    `To: ${Array.isArray(to) ? to.join(", ") : to}`,
    `Subject: ${subject}`,
    "",
    ...body.split("\n"),
  ];

  const width = Math.max(...lines.map((line) => line.length));
  const top = `╔${"═".repeat(width + 2)}╗`;
  const bottom = `╚${"═".repeat(width + 2)}╝`;

  return ["", top, ...lines.map((line) => `║ ${line.padEnd(width, " ")} ║`), bottom, ""].join("\n");
}

/** Logs the email instead of sending it. For local dev and self-host without SMTP. */
export function createConsoleSender(): Email.SenderPort {
  log.warn(
    "CONSOLE SENDER: emails will not be sent only logged to console [DO NOT USE IN PRODUCTION]",
  );
  return {
    async send({ from, to, subject, body }) {
      log.info("email", { from, to, subject });
      console.log(boxedEmail({ from, to, subject, body }));
    },
  };
}
