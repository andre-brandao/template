import {
  desc,
  getColumns,
  sql,
  type Column,
  type SQL,
  type SQLWrapper,
  type Table,
} from "drizzle-orm";

/**
 * Maps caller sort keys onto order clauses, skipping anything unknown. Keys are the signed
 * strings `Common.Query` validates — a leading `-` means descending. Always tiebroken by
 * id: LIMIT/OFFSET over a non-unique sort otherwise repeats and drops rows between pages.
 */
export function orderBy<T extends Table & { id: Column }>(
  table: T,
  sort: readonly string[] | undefined,
  fallback: SQL,
  extra?: Record<string, SQLWrapper>,
) {
  const cols: Record<string, Column | undefined> = getColumns(table);
  const tie = desc(table.id);
  const clauses = (sort ?? []).flatMap((raw) => {
    const key = raw.replace(/^-/, "");
    // `extra` wins over a same-named column, so `assignee` sorts by the joined name
    // rather than the raw id it stores. `hasOwn` keeps `constructor` and friends out.
    const col = extra?.[key] ?? (Object.hasOwn(cols, key) ? cols[key] : undefined);
    if (!col) return [];
    // Postgres flips null placement with direction; pinning it means reversing a sort
    // only reverses the rows that have a value.
    return [raw.startsWith("-") ? sql`${col} desc nulls last` : sql`${col} asc nulls last`];
  });
  return clauses.length ? [...clauses, tie] : [fallback, tie];
}
