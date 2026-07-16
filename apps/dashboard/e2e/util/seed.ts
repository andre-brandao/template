import { Database } from "@template/core/drizzle";
import { Actor } from "@template/core/actor";
import { Todo } from "@template/core/todo";

// Seeds todos straight into the DB for a user (from `as()`), so read/list tests
// don't have to create each one through the UI. `Todo.create` reads the actor,
// so it runs inside `Actor.provide`.
export function seed(uid: string, titles: string[]) {
  return Database.provide(process.env.DATABASE_URL!, () =>
    Actor.provide("user", { userID: uid }, () =>
      Promise.all(titles.map((title) => Todo.create({ title }))),
    ),
  );
}
