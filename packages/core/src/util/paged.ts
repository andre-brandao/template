import { count } from "drizzle-orm";
import { Database } from "../drizzle";

/** One page of rows plus the total match count, in a single round trip pair. */
export function paged<R, O>(
  meta: { page: number; pageSize: number; limit: number; offset: number },
  table: any,
  where: any,
  order: any,
  map: (row: R) => O,
) {
  return Database.use(async (tx) => {
    const [rows, totalRows] = await Promise.all([
      tx.select().from(table).where(where).orderBy(order).limit(meta.limit).offset(meta.offset),
      tx.select({ total: count() }).from(table).where(where),
    ] as const);
    return {
      data: rows.map(map),
      page: meta.page,
      pageSize: meta.pageSize,
      total: totalRows[0]?.total ?? 0,
    };
  });
}
