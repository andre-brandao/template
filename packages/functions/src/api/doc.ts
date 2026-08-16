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

/** The shared body for one error status. A route lists only the ones it can return. */
const error = (status: keyof typeof ErrorResponses) => ErrorResponses[status];

/** The same, for the several a route usually returns at once. Spread into its responses. */
const errors = <T extends keyof typeof ErrorResponses>(...codes: T[]) =>
  Object.fromEntries(codes.map((c) => [c, ErrorResponses[c]])) as {
    [K in T]: (typeof ErrorResponses)[K];
  };

/** Every route in a handler shares a tag, so it is bound once at the top of the file. */
export function describe(tag: string) {
  // Errors are not merged in: a route only documents the ones it can actually return.
  const doc = (meta: Meta, responses: Responses) =>
    describeRoute({
      tags: [tag],
      summary: meta.title,
      description: meta.description,
      responses,
    });

  doc.json = body;
  doc.page = page;
  doc.list = list;
  doc.ok = ok;
  doc.error = error;
  doc.errors = errors;
  return doc;
}
