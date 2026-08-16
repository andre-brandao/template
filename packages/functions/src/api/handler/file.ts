import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator, authRequired } from "../common";
import { describe } from "../doc";
import { Actor } from "@template/core/actor";
import { Signing } from "@template/core/key/signing";
import { Storage } from "@template/core/storage";
import { check } from "@template/core/storage/adapter/serve";
import { Examples } from "@template/core/examples";
import { found, VisibleError, ErrorCodes } from "@template/core/error";

export namespace FileApi {
  const MAX = 20 * 1024 * 1024;

  const doc = describe("File");

  /** `Storage.Entry` on the wire — what `list` can report about an object. */
  const Info = z
    .object({
      key: z.string(),
      size: z.number(),
      lastModified: z.iso.datetime().nullable(),
    })
    .meta({
      ref: "File",
      description: "An object on the user's storage disk.",
      example: Examples.File,
    });

  /** `Storage.Meta` — an `Info` plus the content type, which only `head` knows. */
  const Meta = Info.extend({ contentType: z.string() }).meta({
    ref: "FileMeta",
    description: "An object on the user's storage disk, with its content type.",
    example: { ...Examples.File, contentType: "image/png" },
  });

  /** The `:name` path param, before `key()` flattens it to a basename. */
  const param = z.object({ name: z.string() });

  /**
   * There is no metadata table, so a key's prefix *is* its owner. `name` comes off a
   * filename, so it's flattened to a basename — otherwise `../` walks into someone else.
   */
  function key(name: string) {
    const base = name.split(/[\\/]/).at(-1)?.trim();
    if (!base || base === "." || base === "..")
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_PARAMETER,
        `Invalid filename: ${name}`,
      );
    return `${Actor.userID()}/${base}`;
  }

  export const route = new Hono()
    .post(
      "/",
      // Raw: a multipart `requestBody` has no equivalent on a core op, and `doc` only
      // shapes responses.
      describeRoute({
        tags: ["File"],
        summary: "Upload file",
        description:
          "Multipart form with a `file` field. The filename becomes the key, so re-uploading the same name overwrites.",
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { file: { type: "string", format: "binary" } },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          200: doc.json(Meta),
          ...doc.errors(400, 401, 500),
        },
      }),
      authRequired,
      async (c) => {
        const body = await c.req.parseBody();
        const file = body.file;
        if (!(file instanceof globalThis.File))
          return c.json(
            { type: "validation", code: "invalid_parameter", message: "Missing file" },
            400,
          );
        if (file.size > MAX)
          return c.json(
            {
              type: "validation",
              code: "invalid_parameter",
              message: `File too large: max ${MAX} bytes`,
            },
            400,
          );

        const at = key(file.name);
        await Storage.disk().put(
          at,
          new Uint8Array(await file.arrayBuffer()),
          file.type || "application/octet-stream",
        );
        return c.json(found("File", await Storage.disk().head(at)), 200);
      },
    )
    .get(
      "/",
      doc(
        {
          title: "List files",
          description: "Everything under the user's prefix on the default disk, newest first.",
        },
        {
          200: doc.list(Info),
          ...doc.errors(401, 500),
        },
      ),
      authRequired,
      async (c) => {
        const rows = await Storage.disk().list(`${Actor.userID()}/`);
        rows.sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0));
        return c.json(rows, 200);
      },
    )
    .get(
      "/signed",
      doc(
        {
          title: "Get signed file content",
          description:
            "Serves the bytes for a `temporaryUrl` minted by a disk that can't presign (fs, R2 binding). The signature stands in for the session, so no token is needed.",
        },
        // No 401: the signature stands in for the session, so this route never runs `authRequired`.
        {
          200: { description: "The raw file bytes." },
          ...doc.errors(400, 403, 404, 500),
        },
      ),
      validator(
        "query",
        z.object({
          key: z.string(),
          expires: z.coerce.number(),
          kid: z.string(),
          sig: z.string(),
        }),
      ),
      async (c) => {
        const query = c.req.valid("query");
        const secret = await Signing.secret(query.kid);
        if (!secret || !(await check(query, secret)))
          throw new VisibleError(
            "forbidden",
            ErrorCodes.Permission.FORBIDDEN,
            "This link is invalid or has expired",
          );

        const object = found("File", await Storage.disk().get(query.key));
        return new Response(new Blob([new Uint8Array(object.bytes)]), {
          status: 200,
          headers: { "Content-Type": object.contentType },
        });
      },
    )
    .get(
      "/:name/content",
      doc(
        {
          title: "Get file content",
          description:
            "Redirects to a presigned storage URL when the disk supports it; streams the bytes otherwise.",
        },
        {
          200: { description: "The raw file bytes." },
          302: { description: "Redirect to a presigned storage URL." },
          ...doc.errors(400, 401, 404, 500),
        },
      ),
      authRequired,
      validator("param", param),
      async (c) => {
        const at = key(c.req.valid("param").name);
        const url = await Storage.disk().temporaryUrl(at);
        if (url) return c.redirect(url, 302);

        const object = found("File", await Storage.disk().get(at));
        return new Response(new Blob([new Uint8Array(object.bytes)]), {
          status: 200,
          headers: { "Content-Type": object.contentType },
        });
      },
    )
    .patch(
      "/:name",
      doc(
        {
          title: "Rename file",
          description: "Moves the object to a new key under the same prefix.",
        },
        {
          200: doc.json(Meta),
          ...doc.errors(400, 401, 404, 500),
        },
      ),
      authRequired,
      validator("param", param),
      validator("json", z.object({ name: z.string().trim().min(1).max(255) })),
      async (c) => {
        const from = key(c.req.valid("param").name);
        const to = key(c.req.valid("json").name);
        found("File", await Storage.disk().head(from));
        await Storage.disk().move(from, to);
        return c.json(found("File", await Storage.disk().head(to)), 200);
      },
    )
    .delete(
      "/:name",
      // No 404: the disks treat deleting a missing key as a no-op.
      doc(
        { title: "Delete file" },
        {
          200: doc.ok,
          ...doc.errors(400, 401, 500),
        },
      ),
      authRequired,
      validator("param", param),
      async (c) => {
        await Storage.disk().delete(key(c.req.valid("param").name));
        return c.json("ok" as const, 200);
      },
    );
}
