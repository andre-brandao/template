import { error, json } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import { Storage } from "@template/core/storage";
import { MAX, key } from "$lib/server/files";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  if (Actor.use().type !== "user") error(401, "Authentication required");

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof globalThis.File)) error(400, "Missing file");
  if (file.size > MAX) error(400, `File too large: max ${MAX} bytes`);

  const at = key(file.name);
  await Storage.disk().put(
    at,
    new Uint8Array(await file.arrayBuffer()),
    file.type || "application/octet-stream",
  );

  const name = at.split("/").at(-1)!;
  return json({ url: `/files/${encodeURIComponent(name)}`, name });
};
