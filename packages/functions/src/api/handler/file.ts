import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator, authRequired } from "../common";
import { describe } from "../doc";
import { File } from "@template/core/file";
import { Storage } from "@template/core/storage";
import { VisibleError, ErrorCodes } from "@template/core/error";

export namespace FileApi {
  const doc = describe("File");

  /** The `:name` path param, before core flattens it to a basename. */
  const param = z.object({ name: z.string() });

  function bytes(object: Storage.Object) {
    return new Response(new Blob([new Uint8Array(object.bytes)]), {
      status: 200,
      headers: { "Content-Type": object.contentType },
    });
  }

  export const route = new Hono()
    .post(
      "/",
      // Raw: a multipart `requestBody` has no equivalent on a core op, and `doc` only
      // shapes responses.
      describeRoute({
        tags: ["File"],
        summary: File.put.meta.title,
        description: File.put.meta.description,
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
          200: doc.json(File.Meta),
          ...doc.errors(400, 401, 403, 500),
        },
      }),
      authRequired,
      async (c) => {
        const file = (await c.req.parseBody()).file;
        if (!(file instanceof globalThis.File))
          throw new VisibleError(
            "validation",
            ErrorCodes.Validation.INVALID_PARAMETER,
            "Missing file",
          );
        return c.json(await File.put(file), 200);
      },
    )
    .get(
      "/",
      doc(File.list.meta, {
        200: doc.list(File.Info),
        ...doc.errors(401, 403, 500),
      }),
      authRequired,
      async (c) => c.json(await File.list(), 200),
    )
    .get(
      "/signed",
      // No 401: the signature stands in for the session, so this route never runs `authRequired`.
      doc(File.signed.meta, {
        200: { description: "The raw file bytes." },
        ...doc.errors(400, 403, 404, 500),
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
      async (c) => bytes(await File.signed(c.req.valid("query"))),
    )
    .get(
      "/:name/content",
      doc(File.get.meta, {
        200: { description: "The raw file bytes." },
        302: { description: "Redirect to a presigned storage URL." },
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", param),
      async (c) => {
        const name = c.req.valid("param").name;
        const url = await File.url(name);
        if (url) return c.redirect(url, 302);
        return bytes(await File.get(name));
      },
    )
    .patch(
      "/:name",
      doc(File.rename.meta, {
        200: doc.json(File.Meta),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", param),
      validator("json", z.object({ name: File.rename.schema.shape.to })),
      async (c) =>
        c.json(
          await File.rename({ from: c.req.valid("param").name, to: c.req.valid("json").name }),
          200,
        ),
    )
    .delete(
      "/:name",
      // No 404: the disks treat deleting a missing key as a no-op.
      doc(File.remove.meta, {
        200: doc.ok,
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("param", param),
      async (c) => {
        await File.remove(c.req.valid("param").name);
        return c.json("ok" as const, 200);
      },
    );
}
