// fallow-ignore-file code-duplication
import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { Result, validator, ErrorResponses, authRequired } from "../common";
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
        description: "Upload an image file. Multipart form with a single `file` field.",
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
        const info = await File.upload({ file });
        return c.json(info, 200);
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
        responses: {
          200: { description: "The raw file bytes." },
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        const content = found("File", await File.content(c.req.valid("param").id));
        return new Response(content.bytes, {
          status: 200,
          headers: { "Content-Type": content.contentType },
        });
      },
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
