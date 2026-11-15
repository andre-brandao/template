import { beforeAll, describe, expect, test } from "bun:test";
import { Identity } from "../src/identity";
import { Permission } from "../src/permission";
import { VisibleError } from "../src/error";
import { Project } from "../src/project";
import { Insights, Todo } from "../src/todo";
import { User } from "../src/user";
import { Key } from "../src/platform/key";
import { Webhook } from "../src/platform/webhook";
import { App } from "../src/platform/app";
import { File } from "../src/platform/file";
import { Admin } from "../src/platform/admin";
import { Event } from "../src/platform/event";
import { Feedback } from "../src/platform/feedback";
import { Conversation } from "../src/platform/conversation";
import { Panel } from "../src/platform/panel";
import { createUser, testEmail } from "./util";

type Res = keyof typeof Permission.Statement;
type Act<R extends Res> = (typeof Permission.Statement)[R][number];
type Op = ((input: any) => unknown) & { schema: unknown };

/** Rows owned by someone else, so a member's `:own` grants never unlock them. */
const fx = { me: "", other: "", project: "", todo: "", webhook: "", app: "" };

/**
 * One real call per op, under the grant it must be denied without. `own` marks an op that only
 * ever acts on the caller's own row, which a role's `:own` grant legitimately unlocks.
 */
function entry<R extends Res, T extends Op>(
  res: R,
  act: Act<R>,
  op: T,
  input: () => Parameters<T>[0],
  own = false,
) {
  return { res, act, op, input, own };
}

const png = () => new globalThis.File([new Uint8Array([1])], "x.png", { type: "image/png" });
const range = { start: "2026-01-01", end: "2026-01-31" };
const test1 = { key: "sweep", title: "Sweep" };
const spec = { root: "r", elements: { r: { type: "Text", props: {}, children: [] } } };
// Panels live under the caller's own prefix, so no fixture: the check runs before the read.
const panel = crypto.randomUUID();

const ops = [
  entry("admin", "read", Admin.users, () => ({})),
  entry("admin", "read", Admin.tables, () => undefined),
  entry("admin", "read", Admin.queue, () => undefined),
  entry("admin", "read", Admin.counts, () => undefined),
  entry("admin", "read", Admin.server, () => undefined),
  entry("admin", "read", Event.list, () => ({})),
  entry("admin", "read", Event.facets, () => undefined),

  entry("user", "read", User.list, () => ({})),
  entry("user", "read", User.profile, () => fx.other),
  entry("user", "read", Event.by, () => ({ userID: fx.other })),
  entry("user", "create", User.create, () => ({ name: "Sweep", email: testEmail() })),
  entry("user", "update", User.update, () => ({ name: "Renamed" }), true),
  entry("user", "update", User.prefs, () => ({}), true),
  entry("user", "delete", User.remove, () => fx.other),
  entry("user", "delete", User.restore, () => fx.other),
  entry("user", "assign", User.assign, () => ({ id: fx.other, role: "member" as const })),

  entry("project", "read", Project.list, () => ({})),
  entry("project", "read", Project.fromID, () => fx.project),
  entry("project", "create", Project.create, () => ({ name: "Sweep" })),
  entry("project", "update", Project.update, () => ({ id: fx.project, name: "Renamed" })),
  entry("project", "update", Project.link, () => ({ id: fx.project, url: "https://x.dev" })),
  entry("project", "update", Project.unlink, () => ({ id: fx.project, url: "https://x.dev" })),
  entry("project", "update", Project.annotate, () => ({ id: fx.project, unset: ["x.dev/x"] })),
  entry("project", "delete", Project.remove, () => fx.project),

  entry("todo", "read", Todo.list, () => ({})),
  entry("todo", "read", Todo.fromID, () => fx.todo),
  entry("todo", "read", Todo.stages, () => ({})),
  entry("todo", "read", Todo.labels, () => ({})),
  entry("todo", "read", Insights.stats, () => range),
  entry("todo", "read", Insights.status, () => range),
  entry("todo", "read", Insights.load, () => range),
  entry("todo", "read", Insights.due, () => ({})),
  entry("todo", "read", Insights.calendar, () => range),
  entry("todo", "read", Insights.activity, () => range),
  entry("todo", "create", Todo.create, () => ({ title: "Sweep" })),
  entry("todo", "update", Todo.update, () => ({ id: fx.todo, title: "Renamed" })),
  entry("todo", "update", Todo.rename, () => ({ from: "a", to: "b" })),
  entry("todo", "update", Todo.move, () => ({ id: fx.todo, parentID: null })),
  entry("todo", "update", Todo.link, () => ({ id: fx.todo, url: "https://x.dev" })),
  entry("todo", "update", Todo.unlink, () => ({ id: fx.todo, url: "https://x.dev" })),
  entry("todo", "update", Todo.annotate, () => ({ id: fx.todo, unset: ["x.dev/x"] })),
  entry("todo", "delete", Todo.remove, () => fx.todo),

  entry("key", "read", Key.list, () => undefined, true),
  entry("key", "create", Key.create, () => ({ name: "sweep" })),
  entry("key", "delete", Key.remove, () => "key_missing", true),

  entry("webhook", "read", Webhook.list, () => undefined),
  entry("webhook", "create", Webhook.create, () => ({ url: "https://x.dev/hook" })),
  entry("webhook", "update", Webhook.update, () => ({ id: fx.webhook, enabled: false })),
  entry("webhook", "delete", Webhook.remove, () => fx.webhook),

  entry("app", "read", App.list, () => undefined),
  entry("app", "read", App.fromID, () => fx.app),
  entry("app", "read", App.keys, () => fx.app),
  entry("app", "create", App.create, () => ({ name: "Sweep" })),
  entry("app", "update", App.update, () => ({ id: fx.app, name: "Renamed" })),
  entry("app", "update", App.key, () => ({ app: fx.app, name: "sweep" })),
  entry("app", "update", App.revoke, () => ({ app: fx.app, id: "key_missing" })),
  entry("app", "update", App.secret, () => fx.app),
  entry("app", "delete", App.remove, () => fx.app),

  entry("file", "read", File.list, () => undefined),
  entry("file", "read", File.url, () => "x.png"),
  entry("file", "read", File.get, () => "x.png"),
  entry("file", "create", File.put, png),
  entry("file", "update", File.rename, () => ({ from: "x.png", to: "y.png" })),
  entry("file", "delete", File.remove, () => "x.png"),

  entry("feedback", "read", Feedback.list, () => ({})),
  entry("feedback", "read", Feedback.mine, () => undefined, true),
  entry("feedback", "read", Feedback.read, () => `feedback/${fx.other}/x.png`),
  entry("feedback", "create", Feedback.create, () => ({
    body: "Sweep feedback",
    tag: "bug" as const,
  })),
  entry("feedback", "create", Feedback.upload, png),
  entry("feedback", "create", Feedback.Experiment.tally, () => test1),
  entry("feedback", "create", Feedback.Experiment.vote, () => ({
    ...test1,
    variant: "a",
    label: "A",
  })),
  entry("feedback", "create", Feedback.Experiment.expose, () => ({ key: "sweep", variant: "a" })),

  entry("panel", "read", Panel.list, () => undefined),
  entry("panel", "read", Panel.fromID, () => panel),
  entry("panel", "create", Panel.create, () => ({ title: "Sweep", spec })),
  entry("panel", "update", Panel.update, () => ({ id: panel, title: "Renamed", spec }), true),
  entry("panel", "delete", Panel.remove, () => panel, true),
];

/** Ops that check nothing on purpose: a signature or the caller's own lookup is the gate. */
const exempt = new Set<unknown>([
  Key.mint,
  Key.verify,
  Key.owned,
  Key.revoke,
  User.fromID,
  User.providers,
  App.receive,
  File.signed,
  // Scoped to the caller's own conversations by `userID`.
  Conversation.record,
  Conversation.list,
  Conversation.fromID,
  Conversation.remove,
  // Reads a tracker row before it can know whose it is; needs a live adapter to reach the check.
  Feedback.get,
]);

/** Actions with no op to call, so nothing can leak through them yet. */
const gaps = ["key:update"];

/** Every `fn()` op a namespace exports — what a new, unchecked op would be. */
const exported = [
  Project,
  Todo,
  Insights,
  User,
  Key,
  Webhook,
  App,
  File,
  Admin,
  Event,
  Feedback,
  Feedback.Experiment,
  Conversation,
  Panel,
].flatMap((ns) =>
  Object.entries(ns).filter((pair) => typeof pair[1] === "function" && "schema" in pair[1]),
);

/** Everything held except `res:act`: a check on the wrong grant lets the call through. */
function without(res: Res, act: string) {
  const all: any = Permission.Statement;
  return Object.fromEntries(
    Object.keys(all).map((key) => [
      key,
      key === res ? all[key].filter((one: string) => one !== act) : all[key],
    ]),
  ) as Permission.Grants;
}

function label(row: (typeof ops)[number]) {
  return `${row.res}:${row.act} ${exported.find((pair) => pair[1] === row.op)?.[0]}`;
}

async function denied(row: (typeof ops)[number]) {
  const call: any = row.op;
  const err = await Promise.resolve()
    .then(() => call(row.input()))
    .then(
      () => null,
      (err: unknown) => err,
    );
  expect(err).toBeInstanceOf(VisibleError);
  expect((err as VisibleError).message).toMatch(new RegExp(`${row.res}:[\\w/]*${row.act}`));
}

beforeAll(async () => {
  fx.me = (await createUser({ name: "Me", email: testEmail() })).id;
  fx.other = (await createUser({ name: "Other", email: testEmail() })).id;
  await Identity.provide("user", { userID: fx.other, role: "admin" }, async () => {
    fx.project = (await Project.create({ name: "Theirs" })).id;
    fx.todo = (await Todo.create({ title: "Theirs" })).id;
    fx.webhook = (await Webhook.create({ url: "https://x.dev/theirs" })).id;
    fx.app = (await App.create({ name: "Theirs" })).id;
  });
});

describe("permission sweep", () => {
  test("every exported op is swept or exempt", () => {
    const swept = new Set<unknown>(ops.map((row) => row.op));
    const missing = exported.filter((pair) => !swept.has(pair[1]) && !exempt.has(pair[1]));
    expect(missing.map((pair) => pair[0])).toEqual([]);
  });

  test("every action in the statement has an op or is a known gap", () => {
    const covered = new Set(ops.map((row) => `${row.res}:${row.act}`));
    const missing = Object.entries(Permission.Statement).flatMap((pair) =>
      pair[1].map((act) => `${pair[0]}:${act}`).filter((one) => !covered.has(one)),
    );
    expect(missing).toEqual(gaps);
  });

  describe.each(Permission.roles)("%s agent scoped to all but the op's grant", (role) => {
    test.each(ops.map((row) => [label(row), row] as const))("%s", (_, row) =>
      Identity.provide(
        "agent",
        { name: "sweep", userID: fx.me, role, scope: without(row.res, row.act) },
        () => denied(row),
      ),
    );
  });

  describe.each(Permission.roles)("%s outside its grants", (role) => {
    const held: any = Permission.Roles[role];
    const outside = ops.filter(
      (row) =>
        !Permission.can(role, { [row.res]: [row.act] }) &&
        !(row.own && held[row.res]?.includes(`${row.act}:own`)),
    );
    test.each(outside.map((row) => [label(row), row] as const))("%s", (_, row) =>
      Identity.provide("user", { userID: fx.me, role }, () => denied(row)),
    );
  });
});
