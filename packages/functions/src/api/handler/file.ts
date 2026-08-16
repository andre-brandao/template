// fallow-ignore-file code-duplication
import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { Result, validator, ErrorResponses, authRequired } from "../common";
import { Actor } from "@template/core/actor";
import { Signing } from "@template/core/key/signing";
import { Storage } from "@template/core/storage";
import { check } from "@template/core/storage/adapter/serve";
import { Examples } from "@template/core/examples";
import { found, VisibleError, ErrorCodes } from "@template/core/error";

export namespace FileApi {
  const MAX = 20 * 1024 * 1024;

  /** `Storage.Entry` on the wire — what `list` can report about an object. */
  const Entry = z
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

  /** `Storage.Meta` — an `Entry` plus the content type, which only `head` knows. */
  const Meta = Entry.extend({ contentType: z.string() }).meta({
    ref: "FileMeta",
    description: "An object on the user's storage disk, with its content type.",
    example: { ...Examples.File, contentType: "image/png" },
  });

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
          200: {
            content: {
              "application/json": {
                schema: Result(Meta),
                example: { ...Examples.File, contentType: "image/png" },
              },
            },
            description: "The uploaded file.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
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
      describeRoute({
        tags: ["File"],
        summary: "List files",
        description: "Everything under the user's prefix on the default disk, newest first.",
        responses: {
          200: {
            content: {
              "application/json": { schema: Result(Entry.array()), example: [Examples.File] },
            },
            description: "The user's files.",
          },
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      async (c) => {
        const rows = await Storage.disk().list(`${Actor.userID()}/`);
        rows.sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0));
        return c.json(rows, 200);
      },
    )
    .get(
      "/signed",
      describeRoute({
        tags: ["File"],
        summary: "Get signed file content",
        description:
          "Serves the bytes for a `temporaryUrl` minted by a disk that can't presign (fs, R2 binding). The signature stands in for the session, so no token is needed.",
        responses: {
          200: { description: "The raw file bytes." },
          400: ErrorResponses[400],
          403: ErrorResponses[403],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
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
      describeRoute({
        tags: ["File"],
        summary: "Get file content",
        description:
          "Redirects to a presigned storage URL when the disk supports it; streams the bytes otherwise.",
        responses: {
          200: { description: "The raw file bytes." },
          302: { description: "Redirect to a presigned storage URL." },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ name: z.string() })),
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
      describeRoute({
        tags: ["File"],
        summary: "Rename file",
        description: "Moves the object to a new key under the same prefix.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(Meta), example: Examples.File } },
            description: "The renamed file.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ name: z.string() })),
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
      describeRoute({
        tags: ["File"],
        summary: "Delete file",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Deleted.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ name: z.string() })),
      async (c) => {
        await Storage.disk().delete(key(c.req.valid("param").name));
        return c.json("ok" as const, 200);
      },
    );
}
