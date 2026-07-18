import { z } from "zod";
import { and, asc, count, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { TodoTable } from "./todo.sql";

export namespace Insights {
  const DAY = 86_400_000;

  function span(range: { start: string; end: string }) {
    return Math.round((Date.parse(range.end) - Date.parse(range.start)) / DAY) + 1;
  }

  export const Range = z
    .object({
      start: z.iso
        .date()
        .meta({ description: "First day of the range (inclusive).", example: "2026-06-07" }),
      end: z.iso
        .date()
        .meta({ description: "Last day of the range (inclusive).", example: "2026-07-06" }),
    })
    .refine((range) => range.start <= range.end, "start must not be after end")
    .refine((range) => span(range) <= 366, "range must not exceed a year");
  export type Range = z.infer<typeof Range>;

  function mine() {
    return and(eq(TodoTable.userID, Actor.userID()), isNull(TodoTable.timeDeleted));
  }

  function within(col: typeof TodoTable.timeCreated, range: Range) {
    return and(gte(col, new Date(range.start)), lt(col, new Date(Date.parse(range.end) + DAY)));
  }

  function grouped(input: Range) {
    return Database.use((tx) =>
      tx
        .select({ state: TodoTable.state, total: count() })
        .from(TodoTable)
        .where(and(mine(), within(TodoTable.timeCreated, input)))
        .groupBy(TodoTable.state)
        .orderBy(asc(TodoTable.state)),
    );
  }

  /** Everything the stat tiles need, precomputed in one call. */
  export const stats = fn(Range, async (input) => {
    const [rows, overdue] = await Promise.all([
      grouped(input),
      Database.use((tx) =>
        tx
          .select({ total: count() })
          .from(TodoTable)
          .where(and(mine(), eq(TodoTable.state, "open"), lt(TodoTable.dueDate, new Date())))
          .then((rows) => rows[0]?.total ?? 0),
      ),
    ] as const);
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    const done = rows.find((row) => row.state === "closed")?.total ?? 0;
    return {
      total,
      done,
      open: total - done,
      rate: total === 0 ? 0 : Math.round((done / total) * 100),
      overdue,
    };
  });

  /** Per-state totals with bar widths (pct of the largest bucket) precomputed. */
  export const status = fn(Range, async (input) => {
    const found = new Map((await grouped(input)).map((row) => [row.state, row.total]));
    const merged = (["open", "closed"] as const).map((state) => ({
      state,
      total: found.get(state) ?? 0,
    }));
    const max = Math.max(1, ...merged.map((row) => row.total));
    return {
      total: merged.reduce((sum, row) => sum + row.total, 0),
      rows: merged.map((row) => ({ ...row, pct: (row.total / max) * 100 })),
    };
  });

  export const due = fn(z.void(), () =>
    Database.use((tx) =>
      tx
        .select()
        .from(TodoTable)
        .where(
          and(
            mine(),
            eq(TodoTable.state, "open"),
            isNotNull(TodoTable.dueDate),
            gte(TodoTable.dueDate, new Date()),
          ),
        )
        .orderBy(asc(TodoTable.dueDate))
        .limit(5)
        .then((rows) =>
          rows.map((row) => ({
            id: row.id,
            userID: row.userID,
            title: row.title,
            state: row.state,
            dueDate: row.dueDate?.toISOString() ?? null,
          })),
        ),
    ),
  );

  type Unit = "day" | "week" | "month";

  function next(cur: Date, unit: Unit) {
    if (unit === "month") return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
    return new Date(cur.getTime() + (unit === "week" ? 7 : 1) * DAY);
  }

  /** Bucket start dates (ISO) covering the range, aligned to postgres date_trunc. */
  function buckets(range: Range, unit: Unit) {
    const start = new Date(range.start);
    const first =
      unit === "day"
        ? start
        : unit === "week"
          ? new Date(start.getTime() - ((start.getUTCDay() + 6) % 7) * DAY)
          : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const end = Date.parse(range.end);
    const out: string[] = [];
    for (let cur = first; cur.getTime() <= end; cur = next(cur, unit)) {
      out.push(cur.toISOString().slice(0, 10));
    }
    return out;
  }

  /** Per-day created counts over the range for a GitHub-style contribution grid. */
  export const calendar = fn(Range, (input) => {
    const day = sql<string>`to_char(date_trunc('day', ${TodoTable.timeCreated} at time zone 'utc'), 'YYYY-MM-DD')`;
    return Database.use(async (tx) => {
      const rows = await tx
        .select({ day, total: count() })
        .from(TodoTable)
        .where(and(mine(), within(TodoTable.timeCreated, input)))
        .groupBy(day)
        .orderBy(asc(day));
      const max = Math.max(0, ...rows.map((row) => row.total));
      return {
        start: input.start,
        end: input.end,
        max,
        total: rows.reduce((sum, row) => sum + row.total, 0),
        days: rows.map((row) => ({ day: row.day, count: row.total })),
      };
    });
  });

  export const activity = fn(Range, (input) => {
    // Bucket coarser as ranges grow: keeps point counts chart-friendly (~31 max).
    const days = span(input);
    const unit: Unit = days <= 31 ? "day" : days <= 217 ? "week" : "month";
    const made = sql<string>`to_char(date_trunc(${sql.raw(`'${unit}'`)}, ${TodoTable.timeCreated} at time zone 'utc'), 'YYYY-MM-DD')`;
    const ended = sql<string>`to_char(date_trunc(${sql.raw(`'${unit}'`)}, ${TodoTable.timeUpdated} at time zone 'utc'), 'YYYY-MM-DD')`;
    return Database.use(async (tx) => {
      const [created, completed] = await Promise.all([
        tx
          .select({ day: made, total: count() })
          .from(TodoTable)
          .where(and(mine(), within(TodoTable.timeCreated, input)))
          .groupBy(made)
          .then((rows) => new Map(rows.map((row) => [row.day, row.total]))),
        tx
          .select({ day: ended, total: count() })
          .from(TodoTable)
          .where(and(mine(), eq(TodoTable.state, "closed"), within(TodoTable.timeUpdated, input)))
          .groupBy(ended)
          .then((rows) => new Map(rows.map((row) => [row.day, row.total]))),
      ] as const);
      const series = buckets(input, unit).map((day) => ({
        day,
        created: created.get(day) ?? 0,
        completed: completed.get(day) ?? 0,
      }));
      return { active: series.some((point) => point.created > 0 || point.completed > 0), series };
    });
  });
}
