import { AsyncLocalStorage } from "node:async_hooks";
import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";
import { Actor } from "@template/core/actor";
import { Database, sql, type SQL } from "@template/core/drizzle";
import { ErrorCodes, VisibleError } from "@template/core/error";
import type { Permission } from "@template/core/permission";
import { fn } from "@template/core/util/fn";

/**
 * The agent's read-only SQL, for admins and never on the MCP. The model only explores, on a
 * small sample; what the user sees is a panel the browser renders, each block fetching its
 * own rows so they never reach the model.
 */
export namespace Sql {
  /** Table → the resource whose `read` opens it. A table left out is never queryable. */
  export const Tables = {
    user: "user",
    project: "project",
    todo: "todo",
    event: "admin",
  } as const satisfies Record<string, keyof typeof Permission.Statement>;

  export type Table = keyof typeof Tables;

  /** Who may run SQL at all. */
  export const Grant = { admin: ["read"] } as const satisfies Permission.Grants;

  export const Input = z.object({
    sql: z
      .string()
      .trim()
      .min(1)
      .max(8000)
      .describe("One PostgreSQL SELECT (or WITH … SELECT), without a semicolon in the middle."),
    limit: z.number().int().min(1).max(5000).default(200).describe("Most rows returned."),
  });

  export type Result = {
    columns: { name: string; type: string }[];
    rows: Record<string, unknown>[];
    /** There were more rows than `limit`. */
    truncated: boolean;
    ms: number;
  };

  /** How the agent uses the tools; only for whoever gets them. */
  export const guide = `You can explore the database with read-only SQL.
- Start with \`sql_tables\` for the tables and columns this user may read. Never invent columns.
- Query with \`sql\`: one PostgreSQL SELECT. Aggregate in SQL (group by, date_trunc, count) rather than pulling raw rows, and give columns short snake_case aliases.
- Skip removed rows with \`time_deleted is null\`.
- \`sql\` returns a sample of at most 20 rows: use it to learn the data and test the SQL, never to list results to the user.
- To show data, call \`panel\` when it exists: build the UI from its catalog, each block carrying SQL you already tested. The browser fetches the rows and draws them; you get a per-block summary. Don't repeat the numbers in text. Without \`panel\`, summarise in a short markdown table.
- If a query fails, read the error, fix it and retry before explaining.
- When the user wants a panel but doesn't know what to show, interview first with one \`ask\` (what decision it supports, which projects and period matter), then propose 3–6 metrics with a MultiChoice and build the panel from the picks.`;

  /** The tables the actor may query, with their columns and foreign keys. */
  export const tables = fn(z.void(), async () => {
    Actor.check(Grant);
    const names = permitted();
    if (!names.length) return [];
    const [columns, refs] = await Promise.all([
      raw(sql`
        select table_name as table, column_name as name, data_type as type,
               is_nullable = 'YES' as nullable
        from information_schema.columns
        where table_schema = 'public' and table_name in ${names}
        order by table_name, ordinal_position
      `),
      raw(sql`
        select conrelid::regclass::text as table, pg_get_constraintdef(oid) as def
        from pg_constraint
        where contype = 'f' and connamespace = 'public'::regnamespace
      `),
    ]);
    return names.map((table) => ({
      table,
      columns: columns
        .filter((row) => row.table === table)
        .map((row) => ({
          name: String(row.name),
          type: String(row.type),
          nullable: !!row.nullable,
        })),
      refs: refs
        .filter((row) => unquote(String(row.table)) === table)
        .flatMap((row) => {
          const hit = String(row.def).match(/FOREIGN KEY \((.+?)\) REFERENCES (.+?)\((.+?)\)/);
          if (!hit) return [];
          return [{ column: unquote(hit[1]!), target: `${unquote(hit[2]!)}.${unquote(hit[3]!)}` }];
        }),
    }));
  });

  /**
   * Runs one SELECT in a read-only transaction. The plan names every table it touches, and
   * each must be one the actor may read.
   */
  export const run = fn(Input, async (input): Promise<Result> => {
    Actor.check(Grant);
    const query = input.sql.replace(/[\s;]+$/, "");
    if (FORBIDDEN.test(query) || /\bu&["']/i.test(query)) refuse();
    // A subquery admits only a query, and a prepared statement only one: no writes, no `;`.
    const wrapped = `select * from (\n${query}\n) as q limit ${input.limit + 1}`;
    return Database.transaction(async (tx) => {
      const exec = (text: string) =>
        // The `tx` union drops the default `raw` mode, the one that keeps `columns`.
        ((tx as Database.Transaction).execute(text) as unknown as Promise<Rows>).catch(
          (err: unknown) => {
            throw new VisibleError(
              "validation",
              ErrorCodes.Validation.INVALID_PARAMETER,
              `Invalid SQL: ${err instanceof Error ? err.message : String(err)}`,
              "sql",
            );
          },
        );
      await exec("set local transaction_read_only = on");
      await exec(`set local statement_timeout = '${TIMEOUT}'`);
      const plan = await exec(`explain (verbose, format json) ${wrapped}`);
      if (FORBIDDEN.test(JSON.stringify(plan))) refuse();
      const tree = plan[0]?.["QUERY PLAN"];
      check(relations(typeof tree === "string" ? JSON.parse(tree) : tree));
      const start = performance.now();
      const rows = await exec(wrapped);
      const ms = Math.round(performance.now() - start);
      const numeric = new Set(
        rows.columns.filter((col) => NUMERIC.has(col.type)).map((col) => col.name),
      );
      return {
        columns: rows.columns.map((col) => ({ name: col.name, type: TYPES[col.type] ?? "text" })),
        rows: rows
          .slice(0, input.limit)
          .map((row) =>
            Object.fromEntries(
              Object.entries(row).map(([key, value]) => [
                key,
                numeric.has(key) && typeof value === "string" ? Number(value) : value,
              ]),
            ),
          ),
        truncated: rows.length > input.limit,
        ms,
      };
    });
  });

  /** The prompt and tools for whoever may run SQL; nothing for anyone else. */
  export function kit() {
    if (!Actor.can(Grant)) return { prompts: [], tools: [] };
    return { prompts: [guide], tools: tools() };
  }

  /**
   * The agent's server tools. Built inside the request so each call runs under its actor and
   * database, even after the handler has returned the stream.
   */
  export function tools() {
    const scope = AsyncLocalStorage.snapshot();
    return [
      toolDefinition({
        name: "sql_tables",
        description:
          "The tables the user may query with `sql`, with columns, types and foreign keys. Rows with `time_deleted` set were removed.",
        inputSchema: z.object({}),
      }).server(() => scope(() => tables())),
      toolDefinition({
        name: "sql",
        description:
          "Runs one read-only SELECT, only over the tables the user may read (see `sql_tables`), and returns a sample of at most 20 rows to explore and test the SQL. Time-limited.",
        inputSchema: z.object({ sql: Input.shape.sql }),
      }).server((input) => scope(() => run({ sql: input.sql, limit: SAMPLE }))),
    ];
  }

  /** Every relation an `explain (format json)` plan scans. */
  export function relations(plan: unknown) {
    const walk = (node: Node): { schema: string; name: string }[] => [
      ...(node["Relation Name"]
        ? [{ schema: node.Schema ?? "public", name: node["Relation Name"] }]
        : []),
      ...(node.Plans ?? []).flatMap(walk),
    ];
    return (Array.isArray(plan) ? plan : []).flatMap((entry: { Plan?: Node }) =>
      entry.Plan ? walk(entry.Plan) : [],
    );
  }

  // === UTILS ===

  // The model reads every row it gets back; a panel's rows go to the browser instead.
  const SAMPLE = 20;

  const TIMEOUT = "5s";

  /**
   * Functions that read the server, run a SQL string of their own (dodging the table check)
   * or touch the session. Matched in the text and in the planner's deparsed expressions.
   */
  const FORBIDDEN =
    /\b(pg_\w+|lo_\w+|dblink\w*|\w*_to_xml\w*|\w+_to_xmlschema|ts_stat|set_config|current_setting|txid_\w+|inet_\w+|version)"?\s*\(/i;

  // bigint and numeric arrive as strings; a chart needs numbers.
  const NUMERIC = new Set([20, 1700]);

  const TYPES: Record<number, string> = {
    16: "boolean",
    20: "bigint",
    21: "smallint",
    23: "integer",
    700: "real",
    701: "double",
    1700: "numeric",
    1082: "date",
    1114: "timestamp",
    1184: "timestamptz",
    114: "json",
    3802: "jsonb",
  };

  /** postgres.js's raw result: the rows, plus each column's name and type oid. */
  type Rows = Record<string, unknown>[] & { columns: { name: string; type: number }[] };

  type Node = { "Relation Name"?: string; Schema?: string; Plans?: Node[] };

  function permitted() {
    return (Object.keys(Tables) as Table[]).filter((name) =>
      Actor.can({ [Tables[name]]: ["read"] } as Permission.Grants),
    );
  }

  function check(names: { schema: string; name: string }[]) {
    const allowed = new Set<string>(permitted());
    const blocked = [
      ...new Set(
        names
          .filter((rel) => rel.schema !== "public" || !allowed.has(rel.name))
          .map((rel) => (rel.schema === "public" ? rel.name : `${rel.schema}.${rel.name}`)),
      ),
    ];
    if (!blocked.length) return;
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.INSUFFICIENT_PERMISSIONS,
      `Not allowed to query: ${blocked.join(", ")}`,
    );
  }

  function refuse(): never {
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.FORBIDDEN,
      "The query uses a function that is not allowed.",
    );
  }

  function unquote(name: string) {
    return name.replace(/"/g, "").replace(/^public\./, "");
  }

  /** Catalog query the builder can't express. */
  function raw(query: SQL) {
    return Database.use((tx) => tx.execute(query, "objects"));
  }
}
