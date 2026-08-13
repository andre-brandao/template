import type { Message, Port } from "../port";
import { Log } from "../../../util/log";

const log = Log.create({ namespace: "email.console" });

function boxed({ from, to, subject, body }: Message): string {
  const lines = [
    "📧 CONSOLE EMAIL",
    "",
    `From: ${from}`,
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
export function console(): Port {
  log.warn(
    "CONSOLE SENDER: emails will not be sent only logged to console [DO NOT USE IN PRODUCTION]",
  );
  return {
    async send(msg) {
      log.info("email", { from: msg.from, to: msg.to, subject: msg.subject });
      globalThis.console.log(boxed(msg));
    },
  };
}
