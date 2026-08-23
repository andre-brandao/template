import { index, integer, pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../../drizzle/types";

export const AttachmentTable = table(
  "mail_attachment",
  {
    id: id(),
    ...timestamps,
    message: ulid("message").notNull(),
    // Where the bytes are, on whichever disk is configured:
    // `mail/attachments/{message}/{id}/{filename}`. The id segment is what the reference
    // had too — without it, two parts named image001.png on one message overwrite.
    key: text().notNull(),
    filename: text().notNull(),
    type: text().notNull(),
    // Bytes. The 25 MB receive cap keeps this inside an int4.
    size: integer().notNull(),
    // Set when the html body references the part as `cid:...` — an inline image rather
    // than something to list under the message.
    cid: text(),
  },
  (table) => [index("mail_attachment_message").on(table.message)],
);
