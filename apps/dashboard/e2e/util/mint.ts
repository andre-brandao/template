import { Database } from "@template/core/drizzle";
import { User } from "@template/core/user";
import { seal } from "../../src/lib/server/session";

// Creates a real user in the same database the app reads, then seals the dashboard
// session cookie the same way /callback does — so a browser carrying the `auth`
// cookie is authenticated (hooks.server.ts → read → Actor). No login UI, no issuer.
// `role` is threaded through for when a role column lands — informational today.
export function mint(role = "user", opts: { email?: string; name?: string } = {}) {
  return Database.provide(process.env.DATABASE_URL!, async () => {
    const email = opts.email ?? `e2e-${crypto.randomUUID()}@example.com`;
    const userID = await User.create({ name: opts.name ?? "E2E User", email });
    const cookie = await seal({ userID, email });
    return { userID, email, role, cookie };
  });
}
