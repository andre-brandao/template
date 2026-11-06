import { Bus } from "../../platform/bus";
import { Todo } from "../../todo";
import { Log } from "../../util/log";
import { Annotation } from "../annotation";
import { forActor, found, graphql, type Client } from "../client";
import { Issue } from "../issue";

/**
 * App → GitHub. Only todos already mirroring an issue push; nothing creates one. Every push
 * reads the issue first and writes only what differs, so a webhook echo stops here.
 */
export namespace Push {
  const log = Log.create({ namespace: "core.github" });

  export const updated = Bus.subscribe(Todo.Event.Updated, async (event) => {
    const todo = await Todo.fromID(event.data.todo.id);
    const at = Annotation.issue(todo?.metadata.annotations[Annotation.Keys.issue]);
    if (!todo || !at) return;
    const api = await forActor();
    if (!api) return;
    const where = { owner: at.owner, repo: at.repo, issue_number: at.number };
    const keys = Object.keys(event.data.changes);
    const remote = await found(api.rest.issues.get(where));
    if (!remote) return log.warn("issue gone", where);
    const patch = Issue.diffOutbound(todo, remote, keys);
    if (Object.keys(patch).length) await api.rest.issues.update({ ...where, ...patch });
    if (keys.includes("parentID")) await reparent(api, todo, at);
  });

  /** A removed todo closes its issue as not planned. One deleted upstream is left alone. */
  export const removed = Bus.subscribe(Todo.Event.Removed, async (event) => {
    const at = Annotation.issue(event.data.metadata.annotations[Annotation.Keys.issue]);
    if (!at) return;
    const api = await forActor();
    if (!api) return;
    const where = { owner: at.owner, repo: at.repo, issue_number: at.number };
    const remote = await found(api.rest.issues.get(where));
    if (!remote) return;
    const patch = Issue.closeRemoved(remote);
    if (Object.keys(patch).length) await api.rest.issues.update({ ...where, ...patch });
  });

  // === UTILS ===

  /** Points GitHub's parent at the local one's issue, or detaches it. Reads first, so echoes stop. */
  async function reparent(api: Client, todo: Todo.Info, at: Annotation.Ref) {
    const up = todo.parentID ? await Todo.fromID(todo.parentID) : null;
    const target = Annotation.issue(up?.metadata.annotations[Annotation.Keys.issue]);
    const want = target ? (up?.metadata.annotations[Annotation.Keys.id] ?? null) : null;
    const data = await graphql<{
      repository: {
        issue: {
          parent: {
            databaseId: number;
            number: number;
            repository: { name: string; owner: { login: string } };
          } | null;
        } | null;
      } | null;
    }>(api, PARENT, { owner: at.owner, name: at.repo, number: at.number });
    const have = data.repository?.issue?.parent ?? null;
    const step = Issue.nesting(want, have ? String(have.databaseId) : null);
    const id = Number(todo.metadata.annotations[Annotation.Keys.id]);
    if (step === "add" && target)
      await api.request("POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues", {
        owner: target.owner,
        repo: target.repo,
        issue_number: target.number,
        sub_issue_id: id,
        replace_parent: true,
      });
    if (step === "remove" && have)
      await api.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/sub_issue", {
        owner: have.repository.owner.login,
        repo: have.repository.name,
        issue_number: have.number,
        sub_issue_id: id,
      });
  }

  const PARENT = `
    query ($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        issue(number: $number) {
          parent { databaseId number repository { name owner { login } } }
        }
      }
    }`;
}
