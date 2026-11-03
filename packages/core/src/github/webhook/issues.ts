import type { z } from "zod";
import { Todo } from "../../todo";
import { Issue } from "../issue";
import { Repo } from "../repo";
import { asSender, fallbackUser } from "./actor";

/** `issues` events: opened creates the mirror, the rest apply only what differs. */
export async function issues(
  action: string | undefined,
  data: z.infer<typeof Issue.Payload>,
  repo: string,
  sender?: number,
) {
  const todo = await Issue.find(data.id);
  if (action === "opened") {
    const project = todo ? null : await Repo.owner(repo);
    if (!project) return;
    return asSender(sender, project.createdBy, () => Issue.mirror(project.id, repo, data));
  }
  if (!todo) return;
  const user = await fallbackUser(todo);
  if (action === "deleted") return asSender(sender, user, () => Todo.remove(todo.id));
  const patch = Issue.diffInbound(todo, data);
  if (!Object.keys(patch).length) return;
  return asSender(sender, user, () => Todo.update({ id: todo.id, ...patch }));
}
