import { Database } from "@template/core/drizzle";
import { User } from "@template/core/user";
import { Key } from "@template/core/key";

const TTL = 30 * 24 * 60 * 60 * 1000;

// Mints a real session against the same database the app reads, so a `token`
// cookie carrying `key` authenticates the browser (hooks.server.ts → Key.verify).
// `role` is threaded through for when a role column lands — informational today.
// Imports core submodules only; never `@template/core/user/auth` (the sole
// Bun-locked module) — this runs in Playwright's Node worker.
export function mint(role = "user", opts: { email?: string; name?: string } = {}) {
  return Database.provide(process.env.DATABASE_URL!, async () => {
    const email = opts.email ?? `e2e-${crypto.randomUUID()}@example.com`;
    const uid = await User.create({ name: opts.name ?? "E2E User", email });
    const key = await Key.create({
      userID: uid,
      type: "session",
      name: "e2e",
      expiresAt: new Date(Date.now() + TTL),
    });
    return { uid, email, role, token: key.key };
  });
}
