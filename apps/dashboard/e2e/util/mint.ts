import { Actor } from "@template/core/actor";
import { Database } from "@template/core/drizzle";
import type { Permission } from "@template/core/permission";
import { User } from "@template/core/user";
import { seal } from "../../src/lib/server/session";
import { db } from "./db";

// Creates a real user in the same database the app reads, then seals the dashboard
// session cookie the same way /callback does — so a browser carrying the `auth`
// cookie is authenticated (hooks.server.ts → read → Actor). No login UI, no issuer.
export function mint(
  role: Permission.Role = "member",
  opts: { email?: string; name?: string } = {},
) {
  return Database.provide(db, async () => {
    const email = opts.email ?? `e2e-${crypto.randomUUID()}@example.com`;
    const { id: userID } = await User.create({ name: opts.name ?? "E2E User", email });
    // Signup makes everyone a member and the app reads the role off the row, so anything
    // else has to be written there — the cookie only carries who, never what they hold.
    if (role !== "member")
      await Actor.provide("system", {}, () => User.assign({ id: userID, role }));
    const cookie = await seal({ userID, email });
    return { userID, email, role, cookie };
  });
}
