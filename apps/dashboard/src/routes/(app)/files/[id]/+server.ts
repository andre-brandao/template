import { error } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import { File } from "@template/core/file";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  if (Actor.use().type !== "user") error(401, "Authentication required");

  const content = await File.content(params.id);
  if (!content) error(404, "Not found");

  return new Response(new Blob([new Uint8Array(content.bytes)]), {
    headers: { "content-type": content.contentType },
  });
};
