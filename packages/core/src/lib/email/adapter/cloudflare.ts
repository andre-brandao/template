import type { SendEmail } from "@cloudflare/workers-types";
import type { Port } from "../port";

export function cloudflare(binding: SendEmail): Port {
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
