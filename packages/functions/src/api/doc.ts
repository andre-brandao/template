import { z } from "zod";
import { describeRoute, resolver } from "hono-openapi";
import { Common } from "@template/core/common";
import type { Meta } from "@template/core/util/fn";
import { ErrorResponses } from "./common";

type Responses = NonNullable<Parameters<typeof describeRoute>[0]["responses"]>;

/** A JSON body. Description and example both come off the schema's own `.meta()`. */
function body(schema: z.ZodType) {
  const meta = z.globalRegistry.get(schema);
  // OpenAPI requires a response description, so a schema without one emits an invalid spec.
  if (!meta?.description) throw new Error("Response schema needs .meta({ description })");
  return {
    content: { "application/json": { schema: resolver(schema), example: meta.example } },
    description: meta.description,
  };
}

/** `Common.Page(item)`, carrying the item's own docs and example up to the page. */
function page<T extends z.ZodType>(item: T) {
  return body(
    Common.Page(item).meta({
      example: { data: [z.globalRegistry.get(item)?.example], page: 1, pageSize: 20, total: 1 },
    }),
  );
}

/** A bare array, carrying the item's own docs and example up to the array. */
function list<T extends z.ZodType>(item: T) {
  const meta = z.globalRegistry.get(item);
  return body(
    z.array(item).meta({
      description: meta?.description,
      example: meta?.example ? [meta.example] : undefined,
    }),
  );
}

const ok = body(z.literal("ok").meta({ description: "Deleted." }));

/** Every route in a handler shares a tag, so it is bound once at the top of the file. */
export function describe(tag: string) {
  // Every route documents the same errors: `Actor.check` can forbid from anywhere.
  const doc = (meta: Meta, responses: Responses) =>
    describeRoute({
      tags: [tag],
      summary: meta.title,
      description: meta.description,
      // Route-specific entries win, so a handler can replace one with its own prose.
      responses: { ...ErrorResponses, ...responses },
    });

  doc.json = body;
  doc.page = page;
  doc.list = list;
  doc.ok = ok;
  return doc;
}
