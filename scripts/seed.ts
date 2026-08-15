#!/usr/bin/env bun

import { Actor } from "@template/core/actor";
import { Database, sql } from "@template/core/drizzle";
import { Project } from "@template/core/project";
import { Queue } from "@template/core/queue";
import { Todo } from "@template/core/todo";
import { Auth } from "@template/core/user/auth";
import { User } from "@template/core/user";
import { Key } from "@template/core/key";
import { boxed } from "./utils/box";

// Seeding writes hundreds of rows; the per-write core logs bury the two lines that matter.
process.env.LOG_QUIET ??= "true";

const email = process.env.SEED_EMAIL ?? "dev@example.com";
const name = process.env.SEED_NAME ?? "Dev User";

const count = Number(process.env.SEED_TODO_COUNT ?? 260);
const days = Number(process.env.SEED_DAYS ?? 365);
const DAY = 86_400_000;
const now = Date.now();

/** How far back the planned work goes — everything older is history without a stage. */
const PLANNED = 112 * DAY;
const SPRINT = 14 * DAY;

const team = [
  { email: "ana@example.com", name: "Ana Ribeiro" },
  { email: "bruno@example.com", name: "Bruno Costa" },
  { email: "cami@example.com", name: "Cami Duarte" },
];

const projects = ["Website relaunch", "Mobile app", "Internal tools"];

const verbs = [
  "Review",
  "Create",
  "Update",
  "Plan",
  "Ship",
  "Polish",
  "Document",
  "Test",
  "Refactor",
  "Explore",
];
const nouns = [
  "dashboard",
  "auth flow",
  "todo list",
  "insights",
  "settings",
  "forms",
  "layout",
  "data model",
  "API",
  "deploy",
];
const scopes = [
  "for launch",
  "with the team",
  "before Friday",
  "after feedback",
  "for demo",
  "in staging",
  "for users",
];

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function title() {
  return `${pick(verbs)} ${pick(nouns)} ${pick(scopes)}`;
}

// Recency-biased day in the window, at a plausible working hour — spreads creation
// across the whole year so the contribution calendar has organic light/dark days.
function when() {
  const midnight = now - Math.floor(days * Math.random() ** 1.5) * DAY;
  return new Date(midnight - (midnight % DAY) + rand(8, 22) * 3_600_000);
}

/** The sprint covering an instant, numbered from the start of the planned window. */
function stage(at: number) {
  return `Sprint ${Math.floor((at - (now - PLANNED)) / SPRINT) + 1}`;
}

/**
 * Weighted by how long ago the work was due: settled in the past, in flight around
 * now, untouched in the future. Keeps the board, the pipeline and the burn-down
 * looking like a team that is actually working.
 */
function roll<const T>(odds: [number, T][], rest: T) {
  const r = Math.random();
  return odds.find(([p]) => r < p)?.[1] ?? rest;
}

function status(due: number) {
  if (due < now - 3 * DAY)
    return roll(
      [
        [0.85, "done"],
        [0.95, "blocked"],
      ],
      "active",
    );
  if (due < now + SPRINT)
    return roll(
      [
        [0.3, "done"],
        [0.6, "active"],
        [0.75, "blocked"],
      ],
      "planned",
    );
  return roll([[0.6, "backlog"]], "planned");
}

/** Writes the fixtures and returns the dev account's API key. Assumes its providers are set. */
async function seed() {
  const userID = await Auth.provision({ provider: "email", accountId: email, email, name });
  // The dev account owns the instance: `/admin` is otherwise unreachable without hand-writing
  // the promotion SQL. The team below stay members, so both roles are represented locally.
  await Actor.provide("system", {}, () => User.assign({ id: userID, role: "admin" }));
  const key = await Key.create({ userID, name: "seed" });
  const mates = await Promise.all(
    team.map((one) =>
      Auth.provision({ provider: "email", accountId: one.email, email: one.email, name: one.name }),
    ),
  );
  // Unassigned shows up as its own lane in the board and the load chart.
  const assignees = [userID, ...mates, null, ...mates];

  // Matches the row the seed just wrote, so a check that would fail for real fails here too.
  await Actor.provide("user", { userID, role: "admin" }, async () => {
    const list = await Todo.list({ page: 1, pageSize: 100 });
    if (list.total > 0) return;

    const ids = await Promise.all(
      projects.map((project) => Project.create({ name: project }).then((row) => row.id)),
    );

    await Promise.all(
      Array.from({ length: count }, async () => {
        const at = when();
        const sourceID = pick(ids);
        const planned = at.getTime() > now - PLANNED;
        // Planned work starts a few days after it lands and runs for a week or two.
        const start = at.getTime() + rand(0, 4) * DAY;
        const due = start + rand(3, 16) * DAY;
        const state = planned ? status(due) : Math.random() < 0.9 ? "done" : "blocked";
        const started = state === "backlog" || state === "planned" ? null : new Date(start);
        const done = state === "done" ? new Date(rand(start, Math.min(due, now))) : null;

        const { id } = await Todo.create({
          title: title(),
          status: state,
          source: "project",
          sourceID,
          assignee: pick(assignees),
          stage: planned ? stage(start) : undefined,
          startDate: planned ? new Date(start).toISOString() : undefined,
          dueDate: new Date(due).toISOString(),
        });

        // Todo.create stamps the clock to now; backdate the whole trail here.
        await Database.use((tx) =>
          tx.execute(
            sql`
            update todo
            set time_created = ${at.toISOString()}::timestamptz,
                time_updated = ${(done ?? at).toISOString()}::timestamptz,
                time_started = ${started?.toISOString() ?? null}::timestamptz,
                time_done = ${done?.toISOString() ?? null}::timestamptz
            where id = ${id}
          `,
            "objects",
          ),
        );
      }),
    );
  });

  return key;
}

// Fixtures publish events like any other write, so a queue port has to exist. Memory
// discards the jobs: nobody wants 260 seeded todos POSTed at the target's webhooks.
const result = await Database.provide(Database.create(), () =>
  Queue.provide(Queue.Providers.memory(), seed),
);

console.log(boxed(["SEED COMPLETE", "", `Email:   ${email}`, `API key: ${result.key}`]));
