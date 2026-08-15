import { z } from "zod";

export namespace Common {
  export const IdDescription = `Unique object identifier.
The format and length of IDs may change over time.`;

  export const Paginated = z.object({
    page: z.number().min(1).default(1).meta({
      description: "Page number for pagination.",
      example: 1,
    }),
    pageSize: z.number().min(1).max(100).default(20).meta({
      description: "Number of entities per page.",
      example: 10,
    }),
  });

  export type Paginated = z.infer<typeof Paginated>;

  /**
   * Input for a paginated, sortable list — the counterpart to `Common.Page`. Page and
   * pageSize are optional here, defaulted via `Common.page()`. Sort keys are per-namespace
   * and applied in priority order; a leading `-` means descending.
   */
  export function Query<K extends string>(keys: readonly [K, ...K[]]) {
    const signed = keys.flatMap((k) => [k, `-${k}`]) as [K | `-${K}`, ...(K | `-${K}`)[]];
    return Paginated.partial().extend({
      sort: z
        .enum(signed)
        .array()
        .max(3)
        .optional()
        .meta({
          description: "Sort keys in priority order. Prefix with `-` for descending.",
          example: ["-dueDate"],
        }),
    });
  }

  export function Page<T extends z.ZodType>(item: T) {
    return z
      .object({
        data: z.array(item),
        page: z.number().meta({ description: "Page number returned." }),
        pageSize: z.number().meta({ description: "Number of entities per page." }),
        total: z
          .number()
          .meta({ description: "Total number of matching entities across all pages." }),
      })
      .meta({ description: "A page of results." });
  }

  /** Resolves defaults and the limit/offset a query should use for a page of results. */
  export function page(input: { page?: number; pageSize?: number }) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
  }
}
