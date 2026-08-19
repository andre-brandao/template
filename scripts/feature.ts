#!/usr/bin/env bun

// Stamps out a new CRUD feature modeled on the todo reference implementation: core
// module, API handler, id prefix, dashboard remote functions and a minimal page.
// Usage: bun run scripts/feature.ts <name> [prefix]  — e.g. `invoice inv`

const name = process.argv[2] ?? "";
const pascal = name.charAt(0).toUpperCase() + name.slice(1);
const plural = `${name}s`;
const prefix = process.argv[3] ?? name.slice(0, 3);
const root = `${import.meta.dir}/..`;

if (!/^[a-z][a-z0-9]{1,30}$/.test(name)) {
  console.error("Usage: bun run scripts/feature.ts <name> [prefix]");
  console.error("Name must be a singular lowercase word, e.g. invoice");
  process.exit(1);
}

const targets = {
  sql: `${root}/packages/core/src/${name}/${name}.sql.ts`,
  core: `${root}/packages/core/src/${name}/index.ts`,
  test: `${root}/packages/core/test/${name}.test.ts`,
  handler: `${root}/packages/functions/src/api/handler/${name}.ts`,
  mcp: `${root}/packages/functions/src/mcp/tool/${name}.ts`,
  remote: `${root}/apps/dashboard/src/lib/features/${plural}/api/${plural}.remote.ts`,
  form: `${root}/apps/dashboard/src/lib/features/${plural}/components/${pascal}Form.svelte`,
  card: `${root}/apps/dashboard/src/lib/features/${plural}/components/${pascal}Card.svelte`,
  page: `${root}/apps/dashboard/src/lib/features/${plural}/pages/${pascal}sPage.svelte`,
  route: `${root}/apps/dashboard/src/routes/(app)/${plural}/+page.svelte`,
};

for (const target of Object.values(targets)) {
  if (await Bun.file(target).exists()) {
    console.error(`Refusing to overwrite ${target}`);
    process.exit(1);
  }
}

const ids = await Bun.file(`${root}/packages/core/src/identifier.ts`).text();
if (ids.includes(`${name}:`)) {
  console.error(`Prefix for "${name}" already exists in identifier.ts`);
  process.exit(1);
}
if (ids.includes(`"${prefix}"`)) {
  console.error(
    `Prefix "${prefix}" is taken; pass a custom one: bun run scripts/feature.ts ${name} <prefix>`,
  );
  process.exit(1);
}

await Bun.write(
  targets.sql,
  `import { index, pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../drizzle/types";

export const ${pascal}Table = table(
  "${name}",
  {
    id: id(),
    ...timestamps,
    userID: ulid("user_id").notNull(),
    title: text("title").notNull(),
  },
  (table) => [index("${name}_user").on(table.userID)],
);
`,
);

await Bun.write(
  targets.core,
  `import { z } from "zod";
import { and, count, desc, eq, ilike, isNull, type SQLWrapper } from "drizzle-orm";
import { fn } from "../util/fn";
import { found } from "../error";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { sortable } from "../drizzle/order";
import { ${pascal}Table } from "./${name}.sql";

export namespace ${pascal} {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.${pascal}.id }),
      userID: z.string(),
      title: z.string().min(0).max(2000),
    })
    .meta({
      ref: "${pascal}",
      description: "A ${name} that belongs to a user.",
      example: Examples.${pascal},
    });
  export type Info = z.infer<typeof Info>;

  /** Sortable keys mapped to what each orders by — also the allowlist. */
  export const SortableColumns = sortable(
    {
      title: ${pascal}Table.title,
      timeCreated: ${pascal}Table.timeCreated,
    } satisfies Partial<Record<keyof Info, SQLWrapper>>,
    ${pascal}Table.id,
    desc(${pascal}Table.timeCreated),
  );

  export const create = fn(z.object({ title: Info.shape.title.min(1) }), (input) =>
    Database.use((tx) =>
      tx
        .insert(${pascal}Table)
        .values({
          id: Identifier.create("${name}"),
          userID: Actor.userID(),
          title: input.title,
        })
        .returning()
        .then((rows) => serialize(rows[0]!)),
    ),
    { title: "Create ${name}", description: "Create a ${name} for the current user." },
  );

  export const list = fn(
    Common.Query({ sort: SortableColumns.schema, search: z.string().optional() }),
    (input) => {
      const { page, pageSize, limit, offset } = Common.page(input);
      const conditions = [
        eq(${pascal}Table.userID, Actor.userID()),
        isNull(${pascal}Table.timeDeleted),
      ];
      if (input.search) conditions.push(ilike(${pascal}Table.title, \`%\${input.search}%\`));
      const where = and(...conditions);
      return Database.use(async (tx) => {
        const [rows, totals] = await Promise.all([
          tx
            .select()
            .from(${pascal}Table)
            .where(where)
            .orderBy(...SortableColumns.orderBy(input.sort))
            .limit(limit)
            .offset(offset),
          tx.select({ total: count() }).from(${pascal}Table).where(where),
        ] as const);
        return { data: rows.map(serialize), page, pageSize, total: totals[0]?.total ?? 0 };
      });
    },
    { title: "List ${plural}", description: "List the current user's ${plural}. Paginated." },
  );

  export const fromID = fn(Info.shape.id, (id) =>
    Database.use((tx) =>
      tx
        .select()
        .from(${pascal}Table)
        .where(
          and(
            eq(${pascal}Table.id, id),
            eq(${pascal}Table.userID, Actor.userID()),
            isNull(${pascal}Table.timeDeleted),
          ),
        )
        .then((rows) => (rows[0] ? serialize(rows[0]) : null)),
    ),
    { title: "Get ${name}", description: "Fetch a single ${name} by id." },
  );

  export const update = fn(
    z.object({ id: Info.shape.id, title: Info.shape.title.min(1) }),
    async ({ id, title }) => {
      found("${pascal}", await fromID.force(id));

      return Database.use((tx) =>
        tx
          .update(${pascal}Table)
          .set({ title, timeUpdated: new Date() })
          .where(and(eq(${pascal}Table.id, id), eq(${pascal}Table.userID, Actor.userID()))),
      );
    },
    { title: "Update ${name}", description: "Update a ${name}'s title." },
  );

  export const remove = fn(Info.shape.id, async (id) => {
    found("${pascal}", await fromID.force(id));

    return Database.use((tx) =>
      tx
        .update(${pascal}Table)
        .set({ timeDeleted: new Date() })
        .where(and(eq(${pascal}Table.id, id), eq(${pascal}Table.userID, Actor.userID()))),
    );
  }, { title: "Delete ${name}", description: "Soft-delete a ${name}." });

  function serialize(row: typeof ${pascal}Table.$inferSelect): Info {
    return { id: row.id, userID: row.userID, title: row.title };
  }
}
`,
);

await Bun.write(
  targets.test,
  `import { describe, expect } from "bun:test";
import { ${pascal} } from "../src/${name}";
import { withTestUser } from "./util";

describe("${name}", () => {
  withTestUser("create and fetch a ${name}", async ({ userID }) => {
    const { id } = await ${pascal}.create({ title: "First" });
    const row = await ${pascal}.fromID(id);
    expect(row?.title).toBe("First");
    expect(row?.userID).toBe(userID);
  });

  withTestUser("list only returns rows for the current user", async () => {
    await ${pascal}.create({ title: "First" });
    await ${pascal}.create({ title: "Second" });
    const page = await ${pascal}.list({});
    expect(page.data).toHaveLength(2);
    expect(page.total).toBe(2);
  });

  withTestUser("update renames the ${name}", async () => {
    const { id } = await ${pascal}.create({ title: "Before" });
    await ${pascal}.update({ id, title: "After" });
    const row = await ${pascal}.fromID(id);
    expect(row?.title).toBe("After");
  });

  withTestUser("remove soft-deletes the ${name}", async () => {
    const { id } = await ${pascal}.create({ title: "Temporary" });
    await ${pascal}.remove(id);
    expect(await ${pascal}.fromID(id)).toBeNull();
  });
});
`,
);

await Bun.write(
  targets.handler,
  `import { z } from "zod";
import { Hono } from "hono";
import { validator, PaginatedQuery, authRequired } from "../common";
import { describe } from "../doc";
import { ${pascal} } from "@template/core/${name}";
import { found } from "@template/core/error";

export namespace ${pascal}Api {
  const doc = describe("${pascal}");
  const id = z.object({ id: ${pascal}.Info.shape.id });

  export const route = new Hono()
    .get(
      "/",
      doc(${pascal}.list.meta, { 200: doc.page(${pascal}.Info) }),
      authRequired,
      validator("query", PaginatedQuery(${pascal}.list.schema)),
      async (c) => c.json(await ${pascal}.list(c.req.valid("query")), 200),
    )
    .get(
      "/:id",
      doc(${pascal}.fromID.meta, { 200: doc.json(${pascal}.Info) }),
      authRequired,
      validator("param", id),
      async (c) => c.json(found("${pascal}", await ${pascal}.fromID(c.req.valid("param").id)), 200),
    )
    .post(
      "/",
      doc(${pascal}.create.meta, { 200: doc.json(${pascal}.Info) }),
      authRequired,
      validator("json", ${pascal}.create.schema),
      async (c) => c.json(await ${pascal}.create(c.req.valid("json")), 200),
    )
    .patch(
      "/:id",
      doc(${pascal}.update.meta, { 200: doc.json(${pascal}.Info) }),
      authRequired,
      validator("param", id),
      validator("json", ${pascal}.update.schema.omit({ id: true })),
      async (c) => {
        const { id } = c.req.valid("param");
        await ${pascal}.update({ id, ...c.req.valid("json") });
        return c.json(await ${pascal}.fromID(id), 200);
      },
    )
    .delete(
      "/:id",
      doc(${pascal}.remove.meta, { 200: doc.ok }),
      authRequired,
      validator("param", id),
      async (c) => {
        await ${pascal}.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    );
}
`,
);

await Bun.write(
  targets.mcp,
  `import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ${pascal} } from "@template/core/${name}";
import { tools } from "../common";

export function ${name}(server: McpServer) {
  const tool = tools(server);

  tool("${name}_list", ${pascal}.list);
  tool.id("${name}_get", ${pascal}.fromID);
  tool("${name}_create", ${pascal}.create);

  tool("${name}_update", ${pascal}.update, async (input) => {
    await ${pascal}.update(input);
    return ${pascal}.fromID(input.id);
  });

  tool.id("${name}_remove", ${pascal}.remove, async (id) => {
    await ${pascal}.remove(id);
    return "ok";
  });
}
`,
);

await Bun.write(
  targets.remote,
  `import { error } from "@sveltejs/kit";
import { z } from "zod";
import { ${pascal} } from "@template/core/${name}";
import { remote } from "$lib/server/remote";

export const get${pascal}s = remote.query(
  z.object({ q: z.string().optional() }),
  async (input) => {
    const { data } = await ${pascal}.list({ search: input.q, pageSize: 100 });
    return data;
  },
);

export const get${pascal} = remote.query(${pascal}.Info.shape.id, async (id) => {
  const row = await ${pascal}.fromID(id);
  if (!row) error(404, "${pascal} not found");
  return row;
});

export const create${pascal} = remote.form(${pascal}.create.schema, ${pascal}.create);

export const remove${pascal} = remote.form(
  z.object({ id: ${pascal}.Info.shape.id }).transform((input) => input.id),
  ${pascal}.remove,
);
`,
);

await Bun.write(
  targets.form,
  `<script lang="ts">
	import { Button } from '@template/ui';
	import { create${pascal} } from '../api/${plural}.remote';
</script>

{#each create${pascal}.fields.allIssues() ?? [] as issue, i (i)}
	<p class="error">{issue.message}</p>
{/each}

<form class="add" {...create${pascal}}>
	<input placeholder="Title" {...create${pascal}.fields.title.as('text')} />
	<Button type="submit" pending={!!create${pascal}.pending}>Add</Button>
</form>

<style>
	.add {
		display: flex;
		gap: 0.6em;
		margin-bottom: 1.25em;
	}

	input {
		flex: 1;
		font: inherit;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	input:focus-visible {
		border-color: var(--accent);
		outline: none;
	}
</style>
`,
);

await Bun.write(
  targets.card,
  `<script lang="ts">
	import { Button, Card } from '@template/ui';
	import type { ${pascal} } from '@template/core/${name}';
	import { remove${pascal} } from '../api/${plural}.remote';

	let { ${name} }: { ${name}: ${pascal}.Info } = $props();
	const remove = $derived(remove${pascal}.for(${name}.id));
</script>

<Card>
	{#each remove.fields.allIssues() ?? [] as issue, i (i)}
		<p class="error">{issue.message}</p>
	{/each}

	<div class="head">
		<span class="title">{${name}.title}</span>
		<form {...remove}>
			<input {...remove.fields.id.as('hidden', ${name}.id)} />
			<Button variant="danger" type="submit" pending={!!remove.pending}>Delete</Button>
		</form>
	</div>
</Card>

<style>
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75em;
	}

	.title {
		font-weight: 600;
	}
</style>
`,
);

await Bun.write(
  targets.page,
  `<script lang="ts">
	import { get${pascal}s } from '../api/${plural}.remote';
	import ${pascal}Form from '../components/${pascal}Form.svelte';
	import ${pascal}Card from '../components/${pascal}Card.svelte';

	const rows = $derived(await get${pascal}s({}));
</script>

<h1>${pascal}s</h1>

<${pascal}Form />

<div class="list">
	{#each rows as ${name} (${name}.id)}
		<${pascal}Card {${name}} />
	{/each}
	{#if rows.length === 0}
		<p class="empty">No ${plural} yet</p>
	{/if}
</div>

<style>
	.list {
		display: grid;
		gap: 0.75em;
	}

	.empty {
		color: var(--dim);
	}
</style>
`,
);

await Bun.write(
  targets.route,
  `<script lang="ts">
	import ${pascal}sPage from '$lib/features/${plural}/pages/${pascal}sPage.svelte';
</script>

<${pascal}sPage />
`,
);

await Bun.write(
  `${root}/packages/core/src/identifier.ts`,
  ids.replace("\n  } as const;", `\n    ${name}: "${prefix}",\n  } as const;`),
);

const examples = await Bun.file(`${root}/packages/core/src/examples.ts`).text();
const seeded = examples.replace(
  /\n}\s*$/,
  `\n
  export const ${pascal} = {
    id: Id("${name}"),
    userID: Id("user"),
    title: "Example ${name}",
  } as const;
}
`,
);
if (seeded === examples) {
  console.warn(`Could not wire examples.ts automatically; add this to the Examples namespace:`);
  console.warn(
    `  export const ${pascal} = { id: Id("${name}"), userID: Id("user"), title: "Example ${name}" } as const;`,
  );
}
if (seeded !== examples) await Bun.write(`${root}/packages/core/src/examples.ts`, seeded);

const api = await Bun.file(`${root}/packages/functions/src/api/routes.ts`).text();
const wired = api
  .replace(
    `import { TodoApi } from "./handler/todo";`,
    `import { TodoApi } from "./handler/todo";\nimport { ${pascal}Api } from "./handler/${name}";`,
  )
  .replace(
    `.route("/todo", TodoApi.route)`,
    `.route("/todo", TodoApi.route)\n  .route("/${name}", ${pascal}Api.route)`,
  );
if (wired === api) {
  console.warn(`Could not wire routes.ts automatically; add these lines yourself:`);
  console.warn(`  import { ${pascal}Api } from "./handler/${name}";`);
  console.warn(`  .route("/${name}", ${pascal}Api.route)`);
}
if (wired !== api) await Bun.write(`${root}/packages/functions/src/api/routes.ts`, wired);

const mcp = await Bun.file(`${root}/packages/functions/src/mcp/index.ts`).text();
const tooled = mcp
  .replace(
    `import { todo } from "./tool/todo";`,
    `import { todo } from "./tool/todo";\nimport { ${name} } from "./tool/${name}";`,
  )
  .replace("  todo(s);", `  todo(s);\n  ${name}(s);`);
if (tooled === mcp) {
  console.warn(`Could not wire mcp/index.ts automatically; add these lines yourself:`);
  console.warn(`  import { ${name} } from "./tool/${name}";`);
  console.warn(`  ${name}(s);`);
}
if (tooled !== mcp) await Bun.write(`${root}/packages/functions/src/mcp/index.ts`, tooled);

console.log(`Created feature "${name}":`);
for (const target of Object.values(targets)) console.log(`  ${target.replace(`${root}/`, "")}`);
console.log(
  `Wired: identifier prefix "${prefix}", Examples.${pascal}, route /${name}, MCP ${name}_* tools`,
);
console.log(`
Next steps:
  - restart \`bun dev\` (drizzle pushes the new "${name}" table on startup)
  - link it: add { href: '/${plural}', label: '${pascal}s', icon } to a layout's nav.sections
  - \`bun run gen\` to refresh the OpenAPI spec + SDK
  - typecheck: \`cd packages/core && bun typecheck\`
  - tests: \`cd packages/core && bun test ${name}\`
`);
