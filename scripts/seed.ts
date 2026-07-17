#!/usr/bin/env bun

import { Actor } from "@template/core/actor";
import { Database, sql } from "@template/core/drizzle";
import { Todo } from "@template/core/todo";
import { Auth } from "@template/core/user/auth";
import { Key } from "@template/core/key";

const url = process.env.DATABASE_URL ?? Database.DEFAULT_URL;
const email = process.env.SEED_EMAIL ?? "dev@example.com";
const name = process.env.SEED_NAME ?? "Dev User";

const count = Number(process.env.SEED_TODO_COUNT ?? 260);
const days = Number(process.env.SEED_DAYS ?? 365);
const DAY = 86_400_000;
const now = Date.now();

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

function status() {
  const r = Math.random();
  if (r < 0.45) return "done";
  if (r < 0.65) return "in_progress";
  return "pending";
}

const result = await Database.provide(url, async () => {
  const userID = await Auth.provision({ provider: "email", accountId: email, email, name });
  const key = await Key.create({ userID, name: "seed" });

  await Actor.provide("user", { userID }, async () => {
    const list = await Todo.list({ page: 1, pageSize: 100 });
    if (list.total > 0) return;

    await Promise.all(
      Array.from({ length: count }, async () => {
        const at = when();
        const s = status();
        const due = new Date(at.getTime() + rand(1, 30) * DAY);
        const done = s === "done" ? new Date(rand(at.getTime(), now)) : at;
        const id = await Todo.create({ title: title(), status: s, dueDate: due.toISOString() });
        // Todo.create stamps time_created to now; backdate it (and completion) here.
        await Database.use((tx) =>
          tx.execute(sql`
            update todo
            set time_created = ${at.toISOString()}::timestamptz,
                time_updated = ${done.toISOString()}::timestamptz
            where id = ${id}
          `),
        );
      }),
    );
  });

  return key;
});

console.log("Seed completed");
console.log(`Email: ${email}`);
console.log(`API key: ${result.key}`);
