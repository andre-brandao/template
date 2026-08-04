import { error, redirect } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import { Storage } from "@template/core/storage";
import { key } from "$lib/server/files";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  if (Actor.use().type !== "user") error(401, "Authentication required");

  const at = key(params.name);
  const url = await Storage.disk().temporaryUrl(at);
  if (url) redirect(302, url);

  const object = await Storage.disk().get(at);
  if (!object) error(404, "Not found");

  return new Response(new Blob([new Uint8Array(object.bytes)]), {
    headers: { "content-type": object.contentType },
  });
};
