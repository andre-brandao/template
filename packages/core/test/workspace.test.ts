import { beforeAll, describe, expect, it } from "bun:test";
import TENANT from "../migrations/tenant";
import { Database, and, eq, ne, sql } from "../src/drizzle";
import { Identity } from "../src/identity";
import { Queue } from "../src/lib/queue";
import { memory } from "../src/lib/queue/adapter/memory";
import { Project } from "../src/project";
import { Workspace } from "../src/workspace";
import { Workspaces } from "../src/platform/workspace";
import { MemberTable } from "../src/platform/workspace/member.sql";
import { AccessTable } from "../src/platform/workspace/workspace.central";
import { createUser, testEmail } from "./util";

const tag = crypto.randomUUID().slice(0, 8);
const owner = await createUser({ name: "Owner", email: testEmail() });
const stranger = await createUser({ name: "Stranger", email: testEmail() });
const as = <R>(id: string, fn: () => R) =>
  Identity.provide("user", { userID: id, role: "member" }, fn);
const queue = memory();

// Tests db:push instead of generating; while the tenant bundle is empty, a workspace gets its
// tables by cloning public's before the setup job runs its (no-op) migration.
async function clone(schema: string) {
  if (TENANT.length) return;
  await Database.use(async (tx) => {
    await tx.execute(sql.raw(`create schema if not exists "${schema}"`), "objects");
    const rows = await tx.execute<{ name: string }>(
      sql`select tablename as name from pg_tables where schemaname = 'public'`,
      "objects",
    );
    for (const row of rows)
      await tx.execute(
        sql.raw(`create table "${schema}"."${row.name}" (like public."${row.name}" including all)`),
        "objects",
      );
  });
}

const slugs = { a: `a_${tag}`, b: `b_${tag}` };

// `mode()` reads the env per call, so a test flips it around the multi-only ops.
const multi = <R>(fn: () => Promise<R>) => {
  process.env.WORKSPACES = "multi";
  return fn().finally(() => delete process.env.WORKSPACES);
};

// The rejection's message, or "" when it resolved. `.rejects` stalls on these nested contexts under bun.
const fail = (p: Promise<unknown>) =>
  p.then(
    () => "",
    (err: Error) => err.message,
  );

beforeAll(async () => {
  await Queue.provide(queue, async () => {
    for (const slug of Object.values(slugs)) {
      const created = await multi(() =>
        as(owner.id, () => Workspaces.create({ slug, name: slug })),
      );
      await clone(created.schema);
    }
  });
});

describe("workspace", () => {
  it("stays pending until the setup job runs", async () => {
    await expect(multi(() => as(owner.id, () => Workspaces.resolve(slugs.a)))).rejects.toThrow(
      /being set up/,
    );
    const statuses = (await as(owner.id, () => Workspaces.list())).map((ws) => ws.status);
    expect(statuses).toEqual(["pending", "pending"]);

    await Queue.provide(queue, () => Queue.drain());
    expect(queue.rows).toEqual([]);
    expect(await multi(() => as(owner.id, () => Workspaces.resolve(slugs.a)))).toEqual({
      schema: `ws_${slugs.a}`,
      role: "owner",
    });
  });

  it("isolates tenant rows per schema", async () => {
    const a = await multi(() => as(owner.id, () => Workspaces.resolve(slugs.a)));
    const b = await multi(() => as(owner.id, () => Workspaces.resolve(slugs.b)));
    await as(owner.id, () => Workspace.provide(a, () => Project.create({ name: `alpha ${tag}` })));
    await as(owner.id, () => Workspace.provide(b, () => Project.create({ name: `beta ${tag}` })));

    const names = () =>
      as(owner.id, async () => (await Project.list({ search: tag })).data.map((p) => p.name));
    expect(await Workspace.provide(a, names)).toEqual([`alpha ${tag}`]);
    expect(await Workspace.provide(b, names)).toEqual([`beta ${tag}`]);
    expect(await names()).toEqual([]);
  });

  it("lists only the caller's workspaces", async () => {
    const mine = await as(owner.id, () => Workspaces.list());
    expect(mine.map((ws) => ws.slug)).toEqual(expect.arrayContaining([slugs.a, slugs.b]));
    expect(await as(stranger.id, () => Workspaces.list())).toEqual([]);
  });

  it("refuses an outsider", async () => {
    await expect(multi(() => as(stranger.id, () => Workspaces.resolve(slugs.a)))).rejects.toThrow(
      /Not a member/,
    );
    await expect(multi(() => as(stranger.id, () => Workspaces.resolve("missing")))).rejects.toThrow(
      /Not a member/,
    );
  });

  it("refuses to switch inside an open transaction", async () => {
    await Database.transaction(async () => {
      expect(() => Workspace.provide({ schema: "public" }, () => 1)).toThrow(/open transaction/);
    });
  });

  it("rejects schema names that are not workspaces", () => {
    expect(() => Workspace.valid(`ws_a"; drop schema public; --`)).toThrow();
    expect(() => Workspace.valid("central")).toThrow();
    expect(Workspace.valid("public")).toBe("public");
  });

  it("single mode ignores the slug", async () => {
    expect(Workspace.mode()).toBe("single");
    expect(await Workspaces.enter("anything", async () => Workspace.peek())).toEqual({
      schema: "public",
    });
  });
});

describe("single mode", () => {
  const boss = createUser({ name: "Boss", email: testEmail() });

  it("seats a default row and the caller on first read", async () => {
    const id = (await boss).id;
    const first = await as(id, () => Workspaces.current());
    expect(first).toMatchObject({ slug: "default", status: "ready" });
    expect(first?.role).toBeDefined();
    expect((await as(id, () => Workspaces.current()))?.id).toBe(first?.id);
    const people = await as(id, () => Workspaces.members());
    expect(people.map((one) => one.userID)).toContain(id);
  });

  it("lets an owner rename it but never move its slug", async () => {
    const id = (await boss).id;
    // Earlier tests may have seated someone first; make this caller an owner outright.
    await Database.use((tx) =>
      tx.update(MemberTable).set({ role: "owner" }).where(eq(MemberTable.userID, id)),
    );
    const row = await as(id, () => Workspaces.current());
    if (!row) throw new Error("no default workspace");
    const next = await as(id, () => Workspaces.update({ id: row.id, name: `Renamed ${tag}` }));
    expect(next.name).toBe(`Renamed ${tag}`);
    await expect(
      as(id, () => Workspaces.update({ id: row.id, name: "x", slug: `moved_${tag}` })),
    ).rejects.toThrow(/single workspace/);
  });

  it("refuses create and switch", async () => {
    await expect(
      as(owner.id, () => Workspaces.create({ slug: `c_${tag}`, name: "c" })),
    ).rejects.toThrow(/single workspace/);
    await expect(as(owner.id, () => Workspaces.resolve(slugs.a))).rejects.toThrow(
      /single workspace/,
    );
  });
});

describe("workspace roles", () => {
  // Seats the stranger in `a` as a plain member, inline rather than through an invite flow.
  beforeAll(async () => {
    const row = (await as(owner.id, () => Workspaces.list())).find((ws) => ws.slug === slugs.a);
    if (!row) throw new Error("no workspace a");
    await Database.use((tx) =>
      tx.insert(AccessTable).values({ userID: stranger.id, workspaceID: row.id }),
    );
    await Workspace.provide({ schema: `ws_${slugs.a}` }, () =>
      Database.use((tx) =>
        tx
          .insert(MemberTable)
          .values({ userID: stranger.id, name: "Stranger", email: "s@example.com" }),
      ),
    );
  });

  const inA = <R>(id: string, fn: () => Promise<R>) =>
    multi(() => as(id, () => Workspaces.enter(slugs.a, fn)));

  it("keeps a member from editing or reassigning", async () => {
    const row = await inA(stranger.id, () => Workspaces.current());
    expect(row?.role).toBe("member");
    expect(
      await fail(inA(stranger.id, () => Workspaces.update({ id: row?.id ?? "", name: "nope" }))),
    ).toMatch(/owner or admin/);
    expect(
      await fail(inA(stranger.id, () => Workspaces.role({ userID: stranger.id, role: "owner" }))),
    ).toMatch(/owner or admin/);
  });

  it("never changes your own role, nor demotes the last owner", async () => {
    expect(
      await fail(inA(owner.id, () => Workspaces.role({ userID: owner.id, role: "member" }))),
    ).toMatch(/your own role/);
    await inA(owner.id, () => Workspaces.role({ userID: stranger.id, role: "owner" }));
    await inA(stranger.id, () => Workspaces.role({ userID: owner.id, role: "admin" }));
    expect(
      await fail(inA(owner.id, () => Workspaces.role({ userID: stranger.id, role: "member" }))),
    ).toMatch(/at least one owner/);
    const roles = await inA(owner.id, () => Workspaces.members());
    expect(roles.map((one) => [one.userID, one.role])).toEqual(
      expect.arrayContaining([
        [owner.id, "admin"],
        [stranger.id, "owner"],
      ]),
    );
  });

  it("moves the slug in multi mode", async () => {
    const row = await inA(owner.id, () => Workspaces.current());
    const moved = await inA(owner.id, () =>
      Workspaces.update({ id: row?.id ?? "", name: "A", slug: `${slugs.a}_x` }),
    );
    expect(moved.slug).toBe(`${slugs.a}_x`);
    await multi(() =>
      as(owner.id, () => Workspaces.update({ id: moved.id, name: "A", slug: slugs.a })),
    );
  });
});

describe("workspace admin", () => {
  const admin = <R>(fn: () => R) =>
    Identity.provide("user", { userID: owner.id, role: "admin" }, fn);

  it("inspects one workspace from inside it", async () => {
    const found = await admin(() => Workspaces.inspect({ slug: slugs.a }));
    expect(found.workspace.schema).toBe(`ws_${slugs.a}`);
    expect(found.access.map((one) => one.userID)).toEqual(
      expect.arrayContaining([owner.id, stranger.id]),
    );
    expect(found.members.map((one) => one.userID)).toContain(owner.id);
    await expect(admin(() => Workspaces.retry({ slug: slugs.a }))).rejects.toThrow(
      /already set up/,
    );
  });

  it("counts members off central access", async () => {
    const rows = await admin(() => Workspaces.registry());
    expect(rows.find((one) => one.slug === slugs.a)?.members).toBe(2);
    expect(rows.find((one) => one.slug === slugs.b)?.members).toBe(1);
  });

  it("measures every workspace schema, central included", async () => {
    const all = await admin(() => Workspaces.usage({}));
    const schemas = all.map((one) => one.schema);
    expect(schemas).toEqual(expect.arrayContaining([`ws_${slugs.a}`, `ws_${slugs.b}`, "central"]));
    const ours = all.filter(
      (one) => one.schema === `ws_${slugs.a}` || one.schema === `ws_${slugs.b}`,
    );
    expect(ours.every((one) => one.bytes > 0)).toBe(true);
    const [a] = await admin(() => Workspaces.usage({ slug: slugs.a }));
    expect(a?.schema).toBe(`ws_${slugs.a}`);
    expect(a?.breakdown.map((one) => one.name)).toContain("member");
    expect(a?.tables).toBe(a?.breakdown.length);
  });

  it("is closed to a member", () => {
    expect(() => as(stranger.id, () => Workspaces.inspect({ slug: slugs.a }))).toThrow(
      /admin:read/,
    );
  });
});
