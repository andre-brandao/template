import type { SendEmail } from "@cloudflare/workers-types";
import type { Email } from "../index";

export function createCloudflareSender(binding: SendEmail): Email.SenderPort {
  return {
    async send({ from, to, subject, body, html, attachments }) {
      await binding.send({
        from,
        to,
        subject,
        text: body,
        html,
        attachments: attachments?.map((a) => ({
          content: a.content,
          filename: a.filename,
          type: a.contentType ?? "application/octet-stream",
          disposition: "attachment" as const,
        })),
      });
    },
  };
}
