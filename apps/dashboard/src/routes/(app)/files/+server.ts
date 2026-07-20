import { error, json } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import { File } from "@template/core/file";
import { VisibleError } from "@template/core/error";
import type { RequestHandler } from "./$types";

// fallow-ignore-next-line complexity
export const POST: RequestHandler = async ({ request }) => {
  if (Actor.use().type !== "user") error(401, "Authentication required");

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof globalThis.File)) error(400, "Missing file");
  const tags = form.get("tags");

  try {
    const info = await File.upload({
      file,
      tags: typeof tags === "string" && tags ? tags.split(",") : undefined,
    });
    return json({ url: `/files/${info.id}`, id: info.id });
  } catch (err) {
    if (err instanceof VisibleError) error(400, err.message);
    throw err;
  }
};
