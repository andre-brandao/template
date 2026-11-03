import { error, redirect } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import { VisibleError } from "@template/core/error";
import { Feedback } from "@template/core/feedback";
import { Storage } from "@template/core/storage";
import type { RequestHandler } from "./$types";

/** A feedback attachment by storage key: what the issue links to and the back office renders. */
export const GET: RequestHandler = async ({ url }) => {
  if (Actor.use().type !== "user") error(401, "Authentication required");
  const key = url.searchParams.get("key") ?? "";
  // `read` throws its 403 synchronously, so it runs inside the chain to be caught.
  const object = await Promise.resolve()
    .then(() => Feedback.read(key))
    .catch((err) => {
      if (err instanceof VisibleError) error(err.statusCode(), err.message);
      throw err;
    });
  if (!object) error(404, "Not found");

  const signed = await Storage.disk().temporaryUrl(key);
  if (signed) redirect(302, signed);

  // A key is minted once per upload and never rewritten, so the bytes cache for good.
  return new Response(new Blob([new Uint8Array(object.bytes)]), {
    headers: {
      "content-type": object.contentType,
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
};
