import { z } from "zod";
import { desc, sql, type Column, type SQL, type SQLWrapper } from "drizzle-orm";

/**
 * A list's sort vocabulary: each key mapped to the expression it orders by. The map is both
 * the enum the schema publishes and the allowlist `orderBy` checks, so the two cannot drift.
 * Always tiebroken by `id` — LIMIT/OFFSET over a non-unique sort otherwise repeats and drops
 * rows between pages.
 */
export function sortable<M extends Record<string, SQLWrapper>>(
  sorts: M,
  id: Column,
  fallback: SQL,
) {
  type K = Extract<keyof M, string>;
  const keys = Object.keys(sorts);
  // `Object.keys` erases the literal keys; the cast puts them back so `z.infer` keeps the
  // union the dashboard's sort mirrors derive from.
  const signed = keys.flatMap((k) => [k, `-${k}`]) as [K | `-${K}`, ...(K | `-${K}`)[]];
  const tie = desc(id);
  return {
    schema: z
      .enum(signed)
      .array()
      .max(3)
      .optional()
      .meta({
        description: `Sort keys in priority order, one of: ${keys.join(", ")}. Prefix with \`-\` for descending.`,
        example: [`-${keys[0]}`],
      }),
    orderBy: (sort: readonly string[] | undefined) => {
      const clauses = (sort ?? []).flatMap((raw) => {
        const key = raw.replace(/^-/, "");
        // `hasOwn` keeps `constructor` and friends from resolving off the prototype.
        const col = Object.hasOwn(sorts, key) ? sorts[key] : undefined;
        if (!col) return [];
        // Postgres flips null placement with direction; pinning it means reversing a sort
        // only reverses the rows that have a value.
        return [raw.startsWith("-") ? sql`${col} desc nulls last` : sql`${col} asc nulls last`];
      });
      return clauses.length ? [...clauses, tie] : [fallback, tie];
    },
  };
}
