// fallow-ignore-file code-duplication
import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import {
  Result,
  validator,
  ErrorResponses,
  authRequired,
  PaginatedQuery,
  PaginatedResponse,
} from "../common";
import { File } from "@template/core/file";
import { Examples } from "@template/core/examples";
import { found } from "@template/core/error";

export namespace FileApi {
  export const route = new Hono()
    .post(
      "/",
      describeRoute({
        tags: ["File"],
        summary: "Upload file",
        description: "Multipart form with a `file` field, plus optional `tags` (comma-separated).",
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                  tags: { type: "string" },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          200: {
            content: { "application/json": { schema: Result(File.Info), example: Examples.File } },
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
        const tags = body.tags;
        const info = await File.upload({
          file,
          tags: typeof tags === "string" && tags ? tags.split(",") : undefined,
        });
        return c.json(info, 200);
      },
    )
    .get(
      "/",
      describeRoute({
        tags: ["File"],
        summary: "List files",
        description: "The user's files, newest first. Filter by tags (comma-separated) or search.",
        responses: {
          200: PaginatedResponse(File.Info, "A page of files.", Examples.File),
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator(
        "query",
        PaginatedQuery.extend({
          tags: z.string().optional(),
          search: z.string().optional(),
        }),
      ),
      async (c) => {
        const query = c.req.valid("query");
        const result = await File.list({
          ...query,
          tags: query.tags ? query.tags.split(",") : undefined,
        });
        return c.json(result, 200);
      },
    )
    .get(
      "/:id",
      describeRoute({
        tags: ["File"],
        summary: "Get file metadata",
        responses: {
          200: {
            content: { "application/json": { schema: Result(File.Info) } },
            description: "The file's metadata.",
          },
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        const file = found("File", await File.fromID(c.req.valid("param").id));
        return c.json(file, 200);
      },
    )
    .get(
      "/:id/content",
      describeRoute({
        tags: ["File"],
        summary: "Get file content",
        description:
          "Redirects to a presigned storage URL when the backend supports it; streams the bytes otherwise.",
        responses: {
          200: { description: "The raw file bytes." },
          302: { description: "Redirect to a presigned storage URL." },
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        const id = c.req.valid("param").id;
        const url = await File.url({ id });
        if (url) return c.redirect(url, 302);
        const content = found("File", await File.content(id));
        return new Response(new Blob([new Uint8Array(content.bytes)]), {
          status: 200,
          headers: { "Content-Type": content.contentType },
        });
      },
    )
    .patch(
      "/:id",
      describeRoute({
        tags: ["File"],
        summary: "Update file",
        description: "Rename or re-tag a file.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(File.Info) } },
            description: "The updated file.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      validator(
        "json",
        z.object({
          filename: z.string().optional(),
          tags: z.string().array().optional(),
        }),
      ),
      async (c) =>
        c.json(await File.update({ id: c.req.valid("param").id, ...c.req.valid("json") }), 200),
    )
    .delete(
      "/:id",
      describeRoute({
        tags: ["File"],
        summary: "Delete file",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Deleted.",
          },
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        await File.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    );
}
