import { error, redirect } from "@sveltejs/kit";
import { Identity } from "@template/core/identity";
import { Storage } from "@template/core/storage";
import { Project } from "@template/core/project";
import { App } from "@template/core/app";
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

/** Who may change each kind's avatar. Viewing is open to any user. */
const guards = {
  project: async (id: string) => {
    if (!(await Project.fromID(id))) error(404, "Project not found");
  },
  // Your own, or an App's when you manage Apps.
  user: async (id: string) => {
    if (id === Identity.userID()) return;
    if (Identity.can({ app: ["update"] }) && (await App.fromID(id))) return;
    error(403, "Not your avatar");
  },
};

/** Uploading and clearing mutate the subject, so only whoever owns it may. */
async function owned(kind: "user" | "project", id: string) {
  if (Identity.use().type !== "user") error(401, "Authentication required");
  await guards[kind](id);
}

async function save(kind: "user" | "project", id: string, image: string | null) {
  if (kind === "project") return Project.update({ id, image });
  if (id === Identity.userID()) return User.update({ image });
  await App.update({ id, image });
}

export const GET: RequestHandler = async ({ params }) => {
  if (Identity.use().type !== "user") error(401, "Authentication required");

  const { key } = at(params.kind, params.id);
  const url = await Storage.disk().temporaryUrl(key);
  if (url) redirect(302, url, { external: true });

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
  return Response.json({ url });
};

export const DELETE: RequestHandler = async ({ params }) => {
  const { kind, key } = at(params.kind, params.id);
  await owned(kind, params.id);

  await Storage.disk().delete(key);
  await save(kind, params.id, null);
  return Response.json({ url: null });
};
