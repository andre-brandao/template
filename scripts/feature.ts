#!/usr/bin/env bun

// Stamps out a new CRUD feature modeled on the todo reference implementation:
// core module (+schema, +test), API handler (wired into routes), identifier
// prefix, dashboard remote functions and a minimal page.
//
// Usage: bun run scripts/feature.ts <name> [prefix]
//   name    singular, lowercase, single word (e.g. invoice)
//   prefix  id prefix, defaults to the first 3 letters (e.g. inv)

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
import { and, count, desc, eq, ilike, isNull } from "drizzle-orm";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Identifier } from "../identifier";
import { ErrorCodes, VisibleError } from "../error";
import { ${pascal}Table } from "./${name}.sql";

export namespace ${pascal} {
  export const Example = {
    id: "${prefix}_XXXXXXXXXXXXXXXXXXXXXXXXX",
    userID: "usr_XXXXXXXXXXXXXXXXXXXXXXXXX",
    title: "Example ${name}",
  };

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Example.id }),
      userID: z.string(),
      title: z.string(),
    })
    .meta({
      ref: "${pascal}",
      description: "A ${name} that belongs to a user.",
      example: Example,
    });
  export type Info = z.infer<typeof Info>;

  export const create = fn(z.object({ title: z.string().min(1).max(2000) }), async (input) => {
    const id = Identifier.create("${name}");
    await Database.use((tx) =>
      tx.insert(${pascal}Table).values({ id, userID: Actor.userID(), title: input.title }),
    );
    return id;
  });

  export const list = fn(Common.PaginatedInput.extend({ q: z.string().optional() }), (input) => {
    const { page, pageSize, limit, offset } = Common.page(input);
    const conditions = [eq(${pascal}Table.userID, Actor.userID()), isNull(${pascal}Table.timeDeleted)];
    if (input.q) conditions.push(ilike(${pascal}Table.title, \`%\${input.q}%\`));
    const where = and(...conditions);
    return Database.use(async (tx) => {
      const [rows, totals] = await Promise.all([
        tx
          .select()
          .from(${pascal}Table)
          .where(where)
          .orderBy(desc(${pascal}Table.timeCreated))
          .limit(limit)
          .offset(offset),
        tx.select({ total: count() }).from(${pascal}Table).where(where),
      ] as const);
      return { data: rows.map(serialize), page, pageSize, total: totals[0]?.total ?? 0 };
    });
  });

  export const fromID = fn(z.string(), (id) =>
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
  );

  export const update = fn(
    z.object({ id: z.string(), title: z.string().min(1).max(2000) }),
    async (input) => {
      const existing = await fromID.force(input.id);
      if (!existing)
        throw new VisibleError(
          "not_found",
          ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
          "${pascal} not found",
        );

      return Database.use((tx) =>
        tx
          .update(${pascal}Table)
          .set({ title: input.title, timeUpdated: new Date() })
          .where(and(eq(${pascal}Table.id, input.id), eq(${pascal}Table.userID, Actor.userID()))),
      );
    },
  );

  export const remove = fn(z.string(), async (id) => {
    const existing = await fromID.force(id);
    if (!existing)
      throw new VisibleError(
        "not_found",
        ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
        "${pascal} not found",
      );

    return Database.use((tx) =>
      tx
        .update(${pascal}Table)
        .set({ timeDeleted: new Date() })
        .where(and(eq(${pascal}Table.id, id), eq(${pascal}Table.userID, Actor.userID()))),
    );
  });

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
    const id = await ${pascal}.create({ title: "First" });
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
    const id = await ${pascal}.create({ title: "Before" });
    await ${pascal}.update({ id, title: "After" });
    const row = await ${pascal}.fromID(id);
    expect(row?.title).toBe("After");
  });

  withTestUser("remove soft-deletes the ${name}", async () => {
    const id = await ${pascal}.create({ title: "Temporary" });
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
import { describeRoute } from "hono-openapi";
import {
  Result,
  validator,
  ErrorResponses,
  PaginatedQuery,
  PaginatedResponse,
  authRequired,
} from "../common";
import { ${pascal} } from "@template/core/${name}";
import { ErrorCodes, VisibleError } from "@template/core/error";

export namespace ${pascal}Api {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["${pascal}"],
        summary: "List ${plural}",
        description: "List the current user's ${plural}. Paginated.",
        responses: {
          200: PaginatedResponse(${pascal}.Info, "A page of ${plural}.", ${pascal}.Example),
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("query", PaginatedQuery.extend({ q: z.string().optional() })),
      async (c) => c.json(await ${pascal}.list(c.req.valid("query")), 200),
    )
    .get(
      "/:id",
      describeRoute({
        tags: ["${pascal}"],
        summary: "Get ${name}",
        responses: {
          200: {
            content: {
              "application/json": { schema: Result(${pascal}.Info), example: ${pascal}.Example },
            },
            description: "The ${name}.",
          },
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        const row = await ${pascal}.fromID(c.req.valid("param").id);
        if (!row)
          throw new VisibleError(
            "not_found",
            ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
            "${pascal} not found",
          );
        return c.json(row, 200);
      },
    )
    .post(
      "/",
      describeRoute({
        tags: ["${pascal}"],
        summary: "Create ${name}",
        responses: {
          200: {
            content: { "application/json": { schema: Result(${pascal}.Info) } },
            description: "The created ${name}.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("json", ${pascal}.create.schema),
      async (c) => {
        const id = await ${pascal}.create(c.req.valid("json"));
        return c.json(await ${pascal}.fromID(id), 200);
      },
    )
    .patch(
      "/:id",
      describeRoute({
        tags: ["${pascal}"],
        summary: "Update ${name}",
        responses: {
          200: {
            content: { "application/json": { schema: Result(${pascal}.Info) } },
            description: "The updated ${name}.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      validator("json", ${pascal}.update.schema.omit({ id: true })),
      async (c) => {
        const { id } = c.req.valid("param");
        await ${pascal}.update({ id, ...c.req.valid("json") });
        return c.json(await ${pascal}.fromID(id), 200);
      },
    )
    .delete(
      "/:id",
      describeRoute({
        tags: ["${pascal}"],
        summary: "Delete ${name}",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Deleted.",
          },
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
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
  `import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ${pascal} } from "@template/core/${name}";
import { text } from "../common";

export function ${name}(server: McpServer) {
  server.registerTool(
    "${name}_list",
    {
      title: "List ${plural}",
      description: "List the current user's ${plural}. Paginated.",
      inputSchema: {
        q: z.string().optional(),
        page: z.number().min(1).optional(),
        pageSize: z.number().min(1).max(100).optional(),
      },
    },
    async (input) => text(await ${pascal}.list(input)),
  );

  server.registerTool(
    "${name}_get",
    {
      title: "Get ${name}",
      description: "Fetch a single ${name} by id.",
      inputSchema: { id: z.string() },
    },
    async (input) => text(await ${pascal}.fromID(input.id)),
  );

  server.registerTool(
    "${name}_create",
    {
      title: "Create ${name}",
      description: "Create a ${name} for the current user.",
      inputSchema: ${pascal}.create.schema.shape,
    },
    async (input) => {
      const id = await ${pascal}.create(input);
      return text(await ${pascal}.fromID(id));
    },
  );

  server.registerTool(
    "${name}_update",
    {
      title: "Update ${name}",
      description: "Update a ${name}'s title.",
      inputSchema: ${pascal}.update.schema.shape,
    },
    async (input) => {
      await ${pascal}.update(input);
      return text(await ${pascal}.fromID(input.id));
    },
  );

  server.registerTool(
    "${name}_remove",
    {
      title: "Delete ${name}",
      description: "Soft-delete a ${name}.",
      inputSchema: { id: z.string() },
    },
    async (input) => {
      await ${pascal}.remove(input.id);
      return text("ok");
    },
  );
}
`,
);

await Bun.write(
  targets.remote,
  `import { form, query } from "$app/server";
import { error, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { ${pascal} } from "@template/core/${name}";
import { Actor } from "@template/core/actor";
import { guard } from "$lib/server/guard";

function auth() {
  if (Actor.use().type !== "user") redirect(303, "/login");
}

export const get${pascal}s = query(z.object({ q: z.string().optional() }), async (input) => {
  auth();
  const { data } = await ${pascal}.list(input);
  return data;
});

export const get${pascal} = query(${pascal}.Info.shape.id, async (id) => {
  auth();
  const row = await ${pascal}.fromID(id);
  if (!row) error(404, "${pascal} not found");
  return row;
});

export const create${pascal} = form(${pascal}.create.schema, async (input) => {
  auth();
  await guard(() => ${pascal}.create(input));
});

export const remove${pascal} = form(z.object({ id: ${pascal}.Info.shape.id }), async (input) => {
  auth();
  await guard(() => ${pascal}.remove(input.id));
});
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
console.log(`Wired: identifier prefix "${prefix}", route /${name}, MCP ${name}_* tools`);
console.log(`
Next steps:
  - restart \`bun dev\` (drizzle pushes the new "${name}" table on startup)
  - \`bun run gen\` to refresh the OpenAPI spec + SDK
  - add a sidebar link to /${plural} in apps/dashboard/src/lib/components/layout/Sidebar.svelte
  - tests: \`cd packages/core && bun test ${name}\`
`);
