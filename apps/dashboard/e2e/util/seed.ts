import { Database } from "@template/core/drizzle";
import { Actor } from "@template/core/actor";
import { Project } from "@template/core/project";
import { Todo } from "@template/core/todo";

const DAY = 86_400_000;
const day = (offset: number) => new Date(Date.now() + offset * DAY).toISOString();

// Seeds a project and its todos straight into the DB for a user (from `as()`), so
// read/list tests don't have to create each one through the UI. Todos are visible
// workspace-wide, so tests scope themselves to the returned project instead of
// relying on the actor. `Todo.create` reads the actor, so it runs inside `Actor.provide`.
export function seed(uid: string, titles: string[], name = "E2E") {
  return Database.provide(process.env.DATABASE_URL!, () =>
    Actor.provide("user", { userID: uid }, async () => {
      const project = await Project.create({ name: `${name} ${uid.slice(-6)}` });
      await Promise.all(
        titles.map((title, i) =>
          Todo.create({
            title,
            source: "project",
            sourceID: project,
            assignee: uid,
            stage: i % 2 === 0 ? "Sprint 1" : "Sprint 2",
            startDate: day(i),
            dueDate: day(i + 3),
          }),
        ),
      );
      return project;
    }),
  );
}
