import { z } from "zod";
import { getRequestEvent } from "$app/server";
import { Feedback } from "@template/core/feedback";
import { remote } from "$lib/server/remote";

// An untouched picker posts one empty File; it is dropped before the per-file checks run.
const files = z
  .array(z.file())
  .optional()
  .transform((list) => (list ?? []).filter((file) => file.size > 0))
  .pipe(
    Feedback.upload.schema.array().max(Feedback.LIMIT, `At most ${Feedback.LIMIT} attachments`),
  );

/** Stores each file, then files the issue with links to the read route. */
export const send = remote.form(
  Feedback.Input.omit({ attachments: true }).extend({ files }),
  async (input) => {
    const origin = getRequestEvent().url.origin;
    const attachments = await Promise.all(
      input.files.map(async (file) => {
        const one = await Feedback.upload(file);
        return { ...one, url: `${origin}/feedback/file?key=${encodeURIComponent(one.key)}` };
      }),
    );
    return Feedback.create({ ...input, attachments });
  },
);

export const getMine = remote.core(Feedback.mine).query();

// The back office; core gates both on `feedback: read`, which only admins hold unscoped.
export const getIssues = remote.core(Feedback.list).query();
export const getIssue = remote.core(Feedback.get).query();
