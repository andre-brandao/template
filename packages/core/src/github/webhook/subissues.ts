import { Todo } from "../../todo";
import { Issue } from "../issue";
import { asSender, fallbackUser } from "./actor";

/** `sub_issues` events: mirrors the link when both ends are todos under the same owner. */
export async function subissues(
  action: string | undefined,
  parentID: number,
  childID: number,
  sender?: number,
) {
  const [parent, child] = await Promise.all([Issue.find(parentID), Issue.find(childID)]);
  if (!child) return;
  const user = await fallbackUser(child);
  if (action === "sub_issue_added") {
    if (!parent || child.parentID === parent.id || !Issue.sameOwner(child, parent)) return;
    return asSender(sender, user, () => Todo.move({ id: child.id, parentID: parent.id }));
  }
  if (action !== "sub_issue_removed" || !parent || child.parentID !== parent.id) return;
  return asSender(sender, user, () => Todo.move({ id: child.id, parentID: null }));
}
