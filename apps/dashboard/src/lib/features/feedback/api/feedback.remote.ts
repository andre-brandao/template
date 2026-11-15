import { z } from "zod";
import { getRequestEvent } from "$app/server";
import { Feedback } from "@template/core/feedback";
import { remote } from "$lib/server/remote";

// Kit posts proxied LazyFiles, which Bun's `instanceof File` rejects: check the prototype, then
// copy each into a real File for core. An untouched picker's one empty File is dropped first.
const files = z
  .array(z.custom<File>((file) => !!file && Object.getPrototypeOf(file) === File.prototype))
  .optional()
  .transform((list) =>
    Promise.all(
      (list ?? [])
        .filter((file) => file.size > 0)
        .map(async (file) => new File([await file.arrayBuffer()], file.name, { type: file.type })),
    ),
  )
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
