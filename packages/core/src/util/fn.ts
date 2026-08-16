import { z } from "zod";

/** What an operation is, in prose. Read by the API's OpenAPI docs and the MCP tools. */
export type Meta = { title: string; description?: string };

export function fn<T extends z.ZodType, Result, M extends Meta | undefined = undefined>(
  schema: T,
  cb: (input: z.infer<T>) => Result,
  meta?: M,
) {
  const result = (input: z.infer<T>) => {
    const parsed = schema.parse(input);
    return cb(parsed);
  };
  result.force = (input: z.infer<T>) => cb(input);
  result.schema = schema;
  // Generic so an op without docs types as `undefined`, which the API's `doc()` rejects.
  result.meta = meta as M;
  return result;
}
