import type { SendEmail } from "@cloudflare/workers-types";
import type { Port } from "../port";

export function cloudflare(binding: SendEmail): Port {
  return {
    async send({ from, to, cc, bcc, subject, body, html, headers, attachments }) {
      await binding.send({
        from,
        to,
        cc,
        bcc,
        subject,
        text: body,
        html,
        headers,
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
