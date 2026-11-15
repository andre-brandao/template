#!/usr/bin/env bun

// Stamps out a CRUD feature modeled on `project`: table, core module with grants and events,
// API handler, MCP tools, and a dashboard slice on the SDK's TanStack options.
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

const slice = `${root}/apps/dashboard/src/lib/features/${plural}`;
const targets = {
  sql: `${root}/packages/core/src/${name}/${name}.sql.ts`,
  core: `${root}/packages/core/src/${name}/index.ts`,
  test: `${root}/packages/core/test/${name}.test.ts`,
  handler: `${root}/packages/functions/src/api/handler/${name}.ts`,
  mcp: `${root}/packages/functions/src/mcp/tool/${name}.ts`,
  query: `${slice}/api/${plural}.query.ts`,
  form: `${slice}/components/${pascal}Form.svelte`,
  row: `${slice}/components/Row.svelte`,
  page: `${slice}/pages/${pascal}sPage.svelte`,
  route: `${root}/apps/dashboard/src/routes/(app)/(home)/${plural}/+page.svelte`,
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
  `import { index, snakeCase, text } from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../drizzle/types";

export const ${pascal}Table = snakeCase.table(
  "${name}",
  {
    id: id(),
    ...timestamps,
    createdBy: ulid().notNull(),
    title: text().notNull(),
  },
  (table) => [index("${name}_created_by").on(table.createdBy)],
);
`,
);

await Bun.write(
  targets.core,
  `import { z } from "zod";
import { and, count, desc, eq, ilike, isNull, type SQLWrapper } from "drizzle-orm";
import { Assert } from "../util/assert";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { Identity } from "../identity";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { sortable } from "../drizzle/order";
import { Bus } from "../platform/bus";
import { ${pascal}Table } from "./${name}.sql";

export namespace ${pascal} {
  export const assert = Assert.create("${pascal}");

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.${pascal}.id }),
      createdBy: z.string().meta({ description: "Id of the user who created it." }),
      title: z.string().min(1).max(2000).meta({ description: "What it is called." }),
      timeCreated: z.iso.datetime().meta({ description: "When it was created." }),
    })
    .meta({ ref: "${pascal}", description: "A ${name}.", example: Examples.${pascal} });
  export type Info = z.infer<typeof Info>;

  const Patch = Info.pick({ title: true });

  export const Event = {
    Created: Bus.define("${name}.created", Info),
    Updated: Bus.define("${name}.updated", z.object({ ${name}: Info, changes: Patch })),
    Removed: Bus.define("${name}.removed", Info),
  };

  /** Sortable keys mapped to what each orders by — also the allowlist. */
  export const SortableColumns = sortable(
    {
      title: ${pascal}Table.title,
      timeCreated: ${pascal}Table.timeCreated,
    } satisfies Partial<Record<keyof Info, SQLWrapper>>,
    ${pascal}Table.id,
    desc(${pascal}Table.timeCreated),
  );

  export const create = fn(
    Patch,
    (input) => {
      Identity.check({ ${name}: ["create"] });
      const id = Identifier.create("${name}");
      return Database.transaction(async (tx) => {
        await tx.insert(${pascal}Table).values({ id, createdBy: Identity.userID(), title: input.title });
        const ${name} = await assert.exists(fromID.force(id));
        await Event.Created.publish(${name}, { subject: id });
        return ${name};
      });
    },
    { title: "Create ${name}", description: "Create a ${name}." },
  );

  export const list = fn(
    Common.Query({ sort: SortableColumns.schema, search: z.string().optional() }),
    (input) => {
      Identity.check({ ${name}: ["read"] });
      const { page, pageSize, limit, offset } = Common.page(input);
      const conditions = [isNull(${pascal}Table.timeDeleted)];
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
    { title: "List ${plural}", description: "List ${plural}, optionally filtered by title. Paginated." },
  );

  export const fromID = fn(
    Info.shape.id,
    (id) => {
      Identity.check({ ${name}: ["read"] });
      return Database.use((tx) =>
        tx
          .select()
          .from(${pascal}Table)
          .where(and(eq(${pascal}Table.id, id), isNull(${pascal}Table.timeDeleted)))
          .then((rows) => (rows[0] ? serialize(rows[0]) : null)),
      );
    },
    { title: "Get ${name}", description: "Fetch a single ${name} by id." },
  );

  export const update = fn(
    Patch.extend({ id: Info.shape.id }),
    async (input) => {
      const before = await assert.exists(fromID.force(input.id));
      Identity.check({ ${name}: ["update"] }, before.createdBy);
      return Database.transaction(async (tx) => {
        await tx
          .update(${pascal}Table)
          .set({ title: input.title, timeUpdated: new Date() })
          .where(eq(${pascal}Table.id, input.id));
        const ${name} = await assert.exists(fromID.force(input.id));
        await Event.Updated.publish({ ${name}, changes: { title: input.title } }, { subject: input.id });
        return ${name};
      });
    },
    { title: "Update ${name}", description: "Rename a ${name}." },
  );

  export const remove = fn(
    Info.shape.id,
    async (id) => {
      const before = await assert.exists(fromID.force(id));
      Identity.check({ ${name}: ["delete"] }, before.createdBy);
      return Database.transaction(async (tx) => {
        await tx.update(${pascal}Table).set({ timeDeleted: new Date() }).where(eq(${pascal}Table.id, id));
        await Event.Removed.publish(before, { subject: id });
      });
    },
    { title: "Delete ${name}", description: "Soft-delete a ${name}." },
  );

  function serialize(row: typeof ${pascal}Table.$inferSelect): Info {
    return {
      id: row.id,
      createdBy: row.createdBy,
      title: row.title,
      timeCreated: row.timeCreated.toISOString(),
    };
  }
}
`,
);

await Bun.write(
  targets.test,
  `import { describe, expect } from "bun:test";
import { Identity } from "../src/identity";
import { ${pascal} } from "../src/${name}";
import { withTestUser } from "./util";

describe("${name}", () => {
  withTestUser("create and fetch a ${name}", async ({ userID }) => {
    const { id } = await ${pascal}.create({ title: "First" });
    const row = await ${pascal}.fromID(id);
    expect(row?.title).toBe("First");
    expect(row?.createdBy).toBe(userID);
  });

  withTestUser("list finds ${plural} by title", async () => {
    const title = \`Search \${crypto.randomUUID()}\`;
    await ${pascal}.create({ title });
    const page = await ${pascal}.list({ search: title });
    expect(page.data.map((row) => row.title)).toEqual([title]);
  });

  withTestUser("update returns the renamed ${name}", async () => {
    const { id } = await ${pascal}.create({ title: "Before" });
    expect((await ${pascal}.update({ id, title: "After" })).title).toBe("After");
  });

  withTestUser("remove soft-deletes the ${name}", async () => {
    const { id } = await ${pascal}.create({ title: "Temporary" });
    await ${pascal}.remove(id);
    expect(await ${pascal}.fromID(id)).toBeNull();
  });

  withTestUser("a scoped agent needs the ${name} grant", async () => {
    await Identity.delegate("copilot", { todo: ["read"] }, () =>
      expect(() => ${pascal}.create({ title: "Nope" })).toThrow(/${name}:create/),
    );
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

export namespace ${pascal}Api {
  const doc = describe("${pascal}");
  const id = z.object({ id: ${pascal}.Info.shape.id });

  export const route = new Hono()
    .get(
      "/",
      doc(${pascal}.list.meta, {
        200: doc.page(${pascal}.Info),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", PaginatedQuery(${pascal}.list.schema)),
      async (c) => c.json(await ${pascal}.list(c.req.valid("query")), 200),
    )
    .get(
      "/:id",
      doc(${pascal}.fromID.meta, {
        200: doc.json(${pascal}.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      async (c) =>
        c.json(await ${pascal}.assert.exists(${pascal}.fromID(c.req.valid("param").id)), 200),
    )
    .post(
      "/",
      doc(${pascal}.create.meta, {
        200: doc.json(${pascal}.Info),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("json", ${pascal}.create.schema),
      async (c) => c.json(await ${pascal}.create(c.req.valid("json")), 200),
    )
    .patch(
      "/:id",
      doc(${pascal}.update.meta, {
        200: doc.json(${pascal}.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      validator("json", ${pascal}.update.schema.omit({ id: true })),
      async (c) =>
        c.json(await ${pascal}.update({ id: c.req.valid("param").id, ...c.req.valid("json") }), 200),
    )
    .delete(
      "/:id",
      doc(${pascal}.remove.meta, {
        200: doc.ok,
        ...doc.errors(400, 401, 403, 404, 500),
      }),
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
  `import type { McpServer } from "@modelcontextprotocol/server";
import { ${pascal} } from "@template/core/${name}";
import { tools } from "../common";

export function ${name}(server: McpServer) {
  const tool = tools(server);
  const read = tools(server, { readOnlyHint: true });

  read("${name}_list", ${pascal}.list);
  read.id("${name}_get", ${pascal}.fromID);
  tool("${name}_create", ${pascal}.create);
  tool("${name}_update", ${pascal}.update);
  tool.id("${name}_remove", ${pascal}.remove, async (id) => {
    await ${pascal}.remove(id);
    return "ok";
  });
}
`,
);

await Bun.write(
  targets.query,
  `import { createMutation } from "@tanstack/svelte-query";
import {
  delete${pascal}ByIdMutation,
  get${pascal}Options,
  get${pascal}QueryKey,
  post${pascal}Mutation,
} from "@template/sdk/query";

export const list = () => get${pascal}Options({ query: { pageSize: 100 } });

export const create = (opts?: Pick<ReturnType<typeof post${pascal}Mutation>, "onSuccess">) =>
  createMutation(() => ({
    ...post${pascal}Mutation(),
    meta: { invalidates: [get${pascal}QueryKey()] },
    ...opts,
  }));

export const remove = (opts?: Pick<ReturnType<typeof delete${pascal}ByIdMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...delete${pascal}ByIdMutation(),
    meta: { invalidates: [get${pascal}QueryKey()] },
    ...opts,
  }));
`,
);

await Bun.write(
  targets.form,
  `<script lang="ts">
	import { Button, Input, Issue } from '@template/ui';
	import { create } from '../api/${plural}.query';

	const add = create();

	function submit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		const form = e.currentTarget;
		const title = String(new FormData(form).get('title'));
		add.mutate({ body: { title } }, { onSuccess: () => form.reset() });
	}
</script>

<form class="add" onsubmit={submit}>
	<Input name="title" aria-label="Title" placeholder="Title" required />
	<Button type="submit" pending={add.isPending}>Add</Button>
</form>
{#if add.isError}<Issue>{add.error.message}</Issue>{/if}

<style>
	.add {
		display: flex;
		gap: 0.6em;
		margin-bottom: 1.25em;
	}
</style>
`,
);

await Bun.write(
  targets.row,
  `<script lang="ts">
	import type { ${pascal} } from '@template/core/${name}';
	import { Button, toast } from '@template/ui';
	import { remove } from '../api/${plural}.query';

	let { ${name} }: { ${name}: ${pascal}.Info } = $props();

	const drop = remove();
</script>

<li>
	<span>{${name}.title}</span>
	<Button
		variant="ghost"
		pending={drop.isPending}
		onclick={() =>
			drop.mutate({ path: { id: ${name}.id } }, { onError: (err) => toast.error(err.message) })}
	>
		Delete
	</Button>
</li>

<style>
	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75em;
		padding: 0.4em 0.7em;
		border-bottom: 1px solid var(--border);
	}
</style>
`,
);

await Bun.write(
  targets.page,
  `<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Empty, Issue, Skeleton } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import ${pascal}Form from '../components/${pascal}Form.svelte';
	import Row from '../components/Row.svelte';
	import { list } from '../api/${plural}.query';

	const rows = createQuery(list);
</script>

<Header.Root title="${pascal}s">
	<Header.Item label="${pascal}s">{rows.data?.total ?? '–'}</Header.Item>
</Header.Root>

<${pascal}Form />

{#if rows.isPending}
	<Skeleton h="3.25em" />
{:else if rows.isError}
	<Issue>{rows.error.message}</Issue>
{:else if rows.data.data.length === 0}
	<Empty>No ${plural} yet.</Empty>
{:else}
	<ul>
		{#each rows.data.data as ${name} (${name}.id)}
			<Row {${name}} />
		{/each}
	</ul>
{/if}

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--border);
	}
</style>
`,
);

await Bun.write(
  targets.route,
  `<script lang="ts">
	import ${pascal}sPage from '#lib/features/${plural}/pages/${pascal}sPage.svelte';
</script>

<${pascal}sPage />
`,
);

await Bun.write(
  `${root}/packages/core/src/identifier.ts`,
  ids.replace("\n  } as const;", `\n    ${name}: "${prefix}",\n  } as const;`),
);

/** Applies one edit to a file, or prints what to add by hand when its anchor moved. */
async function wire(file: string, edits: [string | RegExp, string][], hint: string[]) {
  const before = await Bun.file(`${root}/${file}`).text();
  const after = edits.reduce((text, [from, to]) => text.replace(from, to), before);
  if (after !== before) return Bun.write(`${root}/${file}`, after);
  console.warn(`Could not wire ${file} automatically; add this yourself:`);
  for (const line of hint) console.warn(`  ${line}`);
}

const grants = `${name}: ["read", "create", "update", "delete"],`;
await wire(
  "packages/core/src/permission.ts",
  [
    ["\n  } as const;\n", `\n    ${grants}\n  } as const;\n`],
    ["\n    },\n  } as const satisfies", `\n      ${grants}\n    },\n  } as const satisfies`],
  ],
  [`${grants} — in Statement and in Roles.member`],
);

const example = `export const ${pascal} = {
    id: Id("${name}"),
    createdBy: Id("user"),
    title: "Example ${name}",
    timeCreated: "2026-06-07T00:00:00.000Z",
  } as const;`;
await wire("packages/core/src/examples.ts", [[/\n}\s*$/, `\n\n  ${example}\n}\n`]], [example]);

await wire(
  "packages/functions/src/api/routes.ts",
  [
    [
      `import { TodoApi } from "./handler/todo";`,
      `import { TodoApi } from "./handler/todo";\nimport { ${pascal}Api } from "./handler/${name}";`,
    ],
    [
      `.route("/todo", TodoApi.route)`,
      `.route("/todo", TodoApi.route)\n  .route("/${name}", ${pascal}Api.route)`,
    ],
  ],
  [`import { ${pascal}Api } from "./handler/${name}";`, `.route("/${name}", ${pascal}Api.route)`],
);

await wire(
  "packages/functions/src/mcp/index.ts",
  [
    [
      `import { todo } from "./tool/todo";`,
      `import { todo } from "./tool/todo";\nimport { ${name} } from "./tool/${name}";`,
    ],
    ["  todo(s);", `  todo(s);\n  ${name}(s);`],
  ],
  [`import { ${name} } from "./tool/${name}";`, `${name}(s);`],
);

console.log(`Created feature "${name}":`);
for (const target of Object.values(targets)) console.log(`  ${target.replace(`${root}/`, "")}`);
console.log(
  `Wired: identifier prefix "${prefix}", Permission "${name}", Examples.${pascal}, route /${name}, MCP ${name}_* tools`,
);
console.log(`
Next steps (yours to run):
  - \`bun run fmt\`: the templates are not line-wrapped
  - \`cd packages/core && bun db:generate\` for the "${name}" table, then migrate
  - \`cd packages/functions && bun run gen:spec\`, then \`cd packages/sdk/ts && bun run gen\`:
    the dashboard slice imports the SDK's ${name} options, which don't exist until then
  - link it: add { href: '/${plural}', label: '${pascal}s', icon } to routes/(app)/(home)/+layout.ts
  - \`bun typecheck\` in packages/core, packages/functions and apps/dashboard
  - \`cd packages/core && bun test ${name}\`
`);
