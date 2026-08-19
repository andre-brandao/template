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
   * Input for a paginated list — the counterpart to `Common.Page`. Page and pageSize are
   * optional here, defaulted via `Common.page()`; everything else is the caller's filters.
   */
  export function Query<S extends z.ZodRawShape>(shape: S) {
    return Paginated.partial().extend(shape);
  }

  export function Page<T extends z.ZodType>(item: T) {
    return z
      .object({
        data: z.array(item),
        page: Paginated.shape.page
          .unwrap()
          .meta({ description: "Page number returned.", example: 1 }),
        pageSize: Paginated.shape.pageSize
          .unwrap()
          .meta({ description: "Number of entities per page.", example: 10 }),
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
