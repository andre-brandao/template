import { query } from "$app/server";
import { z } from "zod";
import { File } from "@template/core/file";
import { auth, remote } from "$lib/server/remote";

export const getFiles = query(
  z.object({
    q: z.string().optional(),
    tag: z.string().optional(),
    page: z.number().optional(),
  }),
  async (input) => {
    auth();
    return File.list({
      search: input.q,
      tags: input.tag ? [input.tag] : undefined,
      page: input.page,
    });
  },
);

export const updateFile = remote(File.update)
  .with(
    z.object({
      id: File.Info.shape.id,
      filename: z.string().trim().min(1).max(255),
      tags: z
        .string()
        .default("")
        .transform((s) =>
          s
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
    }),
  )
  .form();

export const removeFile = remote(File.remove)
  .with(z.object({ id: File.Info.shape.id }).transform((input) => input.id))
  .form();
