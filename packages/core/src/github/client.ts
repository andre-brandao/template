import { Octokit } from "octokit";
import { and, eq } from "drizzle-orm";
import { Actor } from "../actor";
import { Database } from "../drizzle";
import { ErrorCodes, VisibleError } from "../error";
import { ProviderTable } from "../user/provider.sql";
import { Log } from "../util/log";

const log = Log.create({ namespace: "core.github" });

/** An Octokit authenticated with `token`. */
export function forToken(token: string) {
  return new Octokit({ auth: token, userAgent: "template" });
}

export type Client = ReturnType<typeof forToken>;

/** GitHub as `userID`, from the token their GitHub login stored. Null when they have none. */
export async function forUser(userID: string) {
  const [row] = await Database.use((tx) =>
    tx
      .select({ token: ProviderTable.accessToken })
      .from(ProviderTable)
      .where(and(eq(ProviderTable.userID, userID), eq(ProviderTable.providerId, "github"))),
  );
  if (row?.token) return forToken(row.token);
  log.info("skipped: no GitHub token", { userID });
  return null;
}

/** GitHub as whoever is acting. Null (logged) for a system or public actor. */
export function forActor() {
  if (Actor.use().type === "user") return forUser(Actor.userID());
  log.info("skipped: no user to act as");
  return Promise.resolve(null);
}

/** A REST call whose 404/410 means "gone" rather than failure. */
export function found<T>(call: Promise<{ data: T }>) {
  return call.then(
    (res) => res.data,
    (err: { status?: number }) => {
      if (err.status === 404 || err.status === 410) return null;
      throw err;
    },
  );
}

/** GraphQL errors name the problem (a missing board, a missing scope), so they surface. */
export function graphql<T>(api: Client, query: string, variables: Record<string, unknown>) {
  return api.graphql<T>(query, variables).catch((err: Error) => {
    throw new VisibleError(
      "validation",
      ErrorCodes.Server.DEPENDENCY_FAILURE,
      `GitHub: ${err.message}`,
    );
  });
}
