import { Database } from "@template/core/drizzle";
import { Actor } from "@template/core/actor";
import { Member } from "@template/core/organization/member";

// Runs `fn` as `uid` with membership resolved the same way the request hooks
// do, against the app's database.
export function actor<R>(uid: string, fn: () => Promise<R>) {
  return Database.provide(process.env.DATABASE_URL!, async () => {
    const membership = await Member.resolve({ userID: uid });
    return Actor.provide(
      "user",
      { userID: uid, orgID: membership?.orgID, permissions: membership?.permissions },
      fn,
    );
  });
}
