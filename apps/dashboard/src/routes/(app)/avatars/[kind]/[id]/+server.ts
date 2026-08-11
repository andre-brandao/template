import { error, json, redirect } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import { Storage } from "@template/core/storage";
import { Project } from "@template/core/project";
import { User } from "@template/core/user";
import type { RequestHandler } from "./$types";

const MAX = 5 * 1024 * 1024;

/**
 * One deterministic key per subject — an upload overwrites the old image, so
 * there's nothing to garbage-collect. The stored URL carries a `?v=` stamp
 * purely to bust browser caches on change.
 */
function at(kind: string, id: string) {
  if (kind !== "user" && kind !== "project") error(404, "Not found");
  return { kind, key: `avatar/${kind}/${id}` } as const;
}

/** Uploading and clearing mutate the subject, so only its owner may. Viewing is open to any user. */
async function owned(kind: "user" | "project", id: string) {
  if (Actor.use().type !== "user") error(401, "Authentication required");
  if (kind === "user" && id !== Actor.userID()) error(403, "Not your avatar");
  if (kind === "project" && !(await Project.fromID(id))) error(404, "Project not found");
}

async function save(kind: "user" | "project", id: string, image: string | null) {
  if (kind === "user") return User.update({ image });
  await Project.update({ id, image });
}

export const GET: RequestHandler = async ({ params }) => {
  if (Actor.use().type !== "user") error(401, "Authentication required");

  const { key } = at(params.kind, params.id);
  const url = await Storage.disk().temporaryUrl(key);
  if (url) redirect(302, url);

  const object = await Storage.disk().get(key);
  if (!object) error(404, "Not found");

  return new Response(new Blob([new Uint8Array(object.bytes)]), {
    headers: {
      "content-type": object.contentType,
      // Safe to cache hard: the stored URL's `?v=` changes on every upload.
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
};

export const POST: RequestHandler = async ({ params, request }) => {
  const { kind, key } = at(params.kind, params.id);
  await owned(kind, params.id);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof globalThis.File)) error(400, "Missing file");
  if (!file.type.startsWith("image/")) error(400, "Not an image");
  if (file.size > MAX) error(400, `Image too large: max ${MAX} bytes`);

  await Storage.disk().put(key, new Uint8Array(await file.arrayBuffer()), file.type);
  const url = `/avatars/${kind}/${params.id}?v=${Date.now()}`;
  await save(kind, params.id, url);
  return json({ url });
};

export const DELETE: RequestHandler = async ({ params }) => {
  const { kind, key } = at(params.kind, params.id);
  await owned(kind, params.id);

  await Storage.disk().delete(key);
  await save(kind, params.id, null);
  return json({ url: null });
};
