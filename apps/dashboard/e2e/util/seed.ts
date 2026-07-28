import { Todo } from "@template/core/todo";
import { actor } from "./actor";

// Seeds todos straight into the DB for a user (from `as()`), so read/list tests
// don't have to create each one through the UI. `Todo.create` reads the actor's
// org and permissions, so the membership is resolved like the request hooks do.
export function seed(uid: string, titles: string[]) {
  return actor(uid, () => Promise.all(titles.map((title) => Todo.create({ title }))));
}
