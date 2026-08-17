import { z } from "zod";
import { and, asc, count, eq, gte, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { fn } from "../util/fn";
import { Actor } from "../actor";
import { Database } from "../drizzle";
import { iso } from "../util/fmt";
import { UserTable } from "../user/user.sql";
import { StatusValues, TodoTable } from "./todo.sql";

export namespace Insights {
  const DAY = 86_400_000;

  function span(range: { start: string; end: string }) {
    return Math.round((Date.parse(range.end) - Date.parse(range.start)) / DAY) + 1;
  }

  /** Narrows every insight to one owning entity — `/projects/[id]/insights` and nothing else. */
  export const Scope = z.object({
    source: z.string().optional(),
    sourceID: z.string().optional(),
  });
  export type Scope = z.infer<typeof Scope>;

  export const Range = Scope.extend({
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

  /** Every insight funnels through here, so the read check sits here rather than in all six. */
  function visible(input: Scope) {
    Actor.check({ todo: ["read"] });
    return and(
      isNull(TodoTable.timeDeleted),
      input.source ? eq(TodoTable.source, input.source) : undefined,
      input.sourceID ? eq(TodoTable.sourceID, input.sourceID) : undefined,
    );
  }

  /** The two instant columns an insight ever buckets or bounds by. */
  type Stamp = typeof TodoTable.timeCreated | typeof TodoTable.timeDone;

  /** The instant a day begins for the reader — the boundary a bucket edge has to agree with. */
  const at = (day: string) => sql`${day}::timestamp at time zone ${Actor.timezone()}::text`;

  /** A day column truncated in the reader's zone, labelled as the plain day it lands on. */
  const bucket = (unit: Unit, col: Stamp) =>
    sql<string>`to_char(date_trunc(${sql.raw(`'${unit}'`)}, ${col} at time zone ${Actor.timezone()}::text), 'YYYY-MM-DD')`;

  // Both ends in the reader's zone too. Truncating there but bounding in UTC would leak
  // three hours of the neighbouring day into the first and last bucket.
  function within(col: Stamp, range: Range) {
    return and(
      gte(col, at(range.start)),
      lt(col, at(new Date(Date.parse(range.end) + DAY).toISOString().slice(0, 10))),
    );
  }

  function grouped(input: Range) {
    return Database.use((tx) =>
      tx
        .select({ status: TodoTable.status, total: count() })
        .from(TodoTable)
        .where(and(visible(input), within(TodoTable.timeCreated, input)))
        .groupBy(TodoTable.status)
        .orderBy(asc(TodoTable.status)),
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
          .where(
            and(visible(input), ne(TodoTable.status, "done"), lt(TodoTable.dueDate, new Date())),
          )
          .then((rows) => rows[0]?.total ?? 0),
      ),
    ] as const);
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    const of = (status: string) => rows.find((row) => row.status === status)?.total ?? 0;
    const done = of("done");
    return {
      total,
      done,
      active: of("active"),
      blocked: of("blocked"),
      rate: total === 0 ? 0 : Math.round((done / total) * 100),
      overdue,
    };
  });

  /** Per-status totals with bar widths (pct of the largest bucket) precomputed. */
  export const status = fn(Range, async (input) => {
    const found = new Map((await grouped(input)).map((row) => [row.status, row.total]));
    const merged = StatusValues.map((status) => ({ status, total: found.get(status) ?? 0 }));
    const max = Math.max(1, ...merged.map((row) => row.total));
    return {
      total: merged.reduce((sum, row) => sum + row.total, 0),
      rows: merged.map((row) => ({ ...row, pct: (row.total / max) * 100 })),
    };
  });

  /** Who is carrying what, so an overloaded assignee is visible before the dates slip. */
  export const load = fn(Range, (input) =>
    Database.use(async (tx) => {
      const rows = await tx
        .select({ name: UserTable.name, status: TodoTable.status, total: count() })
        .from(TodoTable)
        .leftJoin(UserTable, eq(TodoTable.assignee, UserTable.id))
        .where(and(visible(input), within(TodoTable.timeCreated, input)))
        .groupBy(UserTable.name, TodoTable.status);

      const people = new Map<string, Record<string, number>>();
      for (const row of rows) {
        const who = row.name ?? "Unassigned";
        const bucket = people.get(who) ?? {};
        bucket[row.status] = (bucket[row.status] ?? 0) + row.total;
        people.set(who, bucket);
      }

      const out = [...people].map(([name, bucket]) => ({
        name,
        total: Object.values(bucket).reduce((sum, count) => sum + count, 0),
        active: bucket.active ?? 0,
        planned: bucket.planned ?? 0,
        blocked: bucket.blocked ?? 0,
        done: bucket.done ?? 0,
      }));
      out.sort((a, b) => b.total - a.total);
      return { max: Math.max(1, ...out.map((row) => row.total)), rows: out };
    }),
  );

  export const due = fn(Scope, (input) =>
    Database.use((tx) =>
      tx
        .select()
        .from(TodoTable)
        .where(
          and(
            visible(input),
            ne(TodoTable.status, "done"),
            isNotNull(TodoTable.dueDate),
            gte(TodoTable.dueDate, new Date()),
          ),
        )
        .orderBy(asc(TodoTable.dueDate))
        .limit(5)
        .then((rows) =>
          rows.map((row) => ({
            id: row.id,
            title: row.title,
            status: row.status,
            dueDate: iso(row.dueDate),
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
    const day = bucket("day", TodoTable.timeCreated);
    return Database.use(async (tx) => {
      const rows = await tx
        .select({ day, total: count() })
        .from(TodoTable)
        .where(and(visible(input), within(TodoTable.timeCreated, input)))
        // By ordinal: the zone is a bound parameter, so repeating the expression here would
        // be a second placeholder and postgres would not match it to the select.
        .groupBy(sql`1`)
        .orderBy(sql`1`);
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
    const made = bucket(unit, TodoTable.timeCreated);
    const ended = bucket(unit, TodoTable.timeDone);
    return Database.use(async (tx) => {
      const [created, completed] = await Promise.all([
        tx
          .select({ day: made, total: count() })
          .from(TodoTable)
          .where(and(visible(input), within(TodoTable.timeCreated, input)))
          .groupBy(sql`1`)
          .then((rows) => new Map(rows.map((row) => [row.day, row.total]))),
        tx
          .select({ day: ended, total: count() })
          .from(TodoTable)
          .where(and(visible(input), within(TodoTable.timeDone, input)))
          .groupBy(sql`1`)
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
