#!/usr/bin/env bun

import { Actor } from "@template/core/actor";
import { Database } from "@template/core/drizzle";
import { Todo } from "@template/core/todo";
import { Auth } from "@template/core/user/auth";
import { User } from "@template/core/user";

const url = process.env.DATABASE_URL ?? Database.DEFAULT_URL;
const email = process.env.SEED_EMAIL ?? "dev@example.com";
const password = process.env.SEED_PASSWORD ?? "password123";
const name = process.env.SEED_NAME ?? "Dev User";

const count = Number(process.env.SEED_TODO_COUNT ?? 48);
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
const statuses = ["pending", "in_progress", "done", "blocked"] as const;

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

function title() {
  return `${pick(verbs)} ${pick(nouns)} ${pick(scopes)}`;
}

function due(i: number) {
  return new Date(Date.now() + (i - 10) * 24 * 60 * 60 * 1000).toISOString();
}

const result = await Database.provide(url, async () => {
  const user = await User.fromEmail(email);
  const auth = user
    ? await Auth.login({ email, password })
    : await Auth.register({ name, email, password });

  await Actor.provide("user", { userID: auth.userID }, async () => {
    const list = await Todo.list({ page: 1, pageSize: 100 });
    if (list.total > 0) return;

    await Promise.all(
      Array.from({ length: count }, async (_, i) => {
        const id = await Todo.create({ title: title(), dueDate: due(i) });
        const status =
          i >= 11 && i < 16 ? (i % 2 === 0 ? "pending" : "in_progress") : pick(statuses);
        if (status === "pending") return;
        await Todo.update({ id, status });
      }),
    );
  });

  return auth;
});

console.log("Seed completed");
console.log(`Email: ${email}`);
console.log(`Password: ${password}`);
console.log(`Token: ${result.token}`);
