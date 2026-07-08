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

  /** Input schema for a paginated `fn()` — page/pageSize are optional, defaulted via `Common.page()`. */
  export const PaginatedInput = Paginated.partial();

  export function Page<T extends z.ZodType>(item: T) {
    return z
      .object({
        data: z.array(item),
        page: z.number().meta({ description: "Page number returned." }),
        pageSize: z.number().meta({ description: "Number of entities per page." }),
        total: z.number().meta({ description: "Total number of matching entities across all pages." }),
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
