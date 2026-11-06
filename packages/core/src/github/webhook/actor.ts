import { and, eq } from "drizzle-orm";
import { Actor } from "../../actor";
import { Database } from "../../drizzle";
import { Project } from "../../project";
import type { Todo } from "../../todo";
import { User } from "../../user";
import { zone } from "../../user/prefs";
import { ProviderTable } from "../../user/provider.sql";
import { Log } from "../../util/log";

const log = Log.create({ namespace: "core.github" });

/** Inbound writes run as the GitHub sender's linked user, else `fallback` (a user id). */
export async function asSender<R>(
  sender: number | undefined,
  fallback: string,
  cb: () => Promise<R>,
) {
  const [row] = sender
    ? await Database.use((tx) =>
        tx
          .select({ id: ProviderTable.userID })
          .from(ProviderTable)
          .where(
            and(
              eq(ProviderTable.providerId, "github"),
              eq(ProviderTable.accountId, String(sender)),
            ),
          ),
      )
    : [];
  const user = (row ? await User.fromID(row.id) : null) ?? (await User.fromID(fallback));
  if (!user) return log.warn("skipped: no user to act as", { fallback });
  return Actor.provide(
    "user",
    { userID: user.id, role: user.role, timezone: zone(user.prefs) },
    cb,
  );
}

/** Who inbound writes to `todo` fall back to: its project's creator, else its own. */
export async function fallbackUser(todo: Todo.Info) {
  const project =
    todo.source === "project" && todo.sourceID ? await Project.fromID(todo.sourceID) : null;
  return project?.createdBy ?? todo.createdBy;
}
