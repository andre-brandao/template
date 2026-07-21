import { Database } from "@template/core/drizzle";
import { Actor } from "@template/core/actor";
import { Member } from "@template/core/organization/member";
import { Todo } from "@template/core/todo";

// Seeds todos straight into the DB for a user (from `as()`), so read/list tests
// don't have to create each one through the UI. `Todo.create` reads the actor's
// org and permissions, so the membership is resolved like the request hooks do.
export function seed(uid: string, titles: string[]) {
  return Database.provide(process.env.DATABASE_URL!, async () => {
    const membership = await Member.resolve({ userID: uid });
    return Actor.provide(
      "user",
      { userID: uid, orgID: membership?.orgID, permissions: membership?.permissions },
      () => Promise.all(titles.map((title) => Todo.create({ title }))),
    );
  });
}
