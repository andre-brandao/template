import { and, eq, Database } from "@template/core/drizzle";
import { User } from "@template/core/user";
import { Organization } from "@template/core/organization";
import { Member } from "@template/core/organization/member";
import { MemberTable } from "@template/core/organization/member.sql";
import { Role } from "@template/core/organization/role";
import { Actor } from "@template/core/actor";
import type { Permission } from "@template/core/organization/permission";
import { seal } from "../../src/lib/server/session";

// Creates a real user (with a personal org) in the same database the app reads,
// then seals the dashboard session cookie the same way /callback does — so a
// browser carrying the `auth` cookie is authenticated (hooks.server.ts → read →
// Actor). No login UI, no issuer. `role` is "owner" for the seeded owner role;
// any other name creates that role (with `permissions`) and assigns it.
export function mint(
  role = "owner",
  opts: { email?: string; name?: string; permissions?: Permission.Info[] } = {},
) {
  return Database.provide(process.env.DATABASE_URL!, async () => {
    const email = opts.email ?? `e2e-${crypto.randomUUID()}@example.com`;
    const userID = await User.create({ name: opts.name ?? "E2E User", email });
    const orgID = await Organization.init({ userID, name: "E2E Org" });

    if (role !== "owner" && role !== "user") {
      const owner = await Member.resolve({ userID, orgID });
      const roleID = await Actor.provide(
        "user",
        { userID, orgID, permissions: owner?.permissions },
        () =>
          Role.create({
            name: role,
            permissions: opts.permissions ?? ["todo:read", "file:read", "member:read"],
          }),
      );
      // assign() blocks self-changes, so update the seeded membership directly.
      await Database.use((tx) =>
        tx
          .update(MemberTable)
          .set({ roleID })
          .where(and(eq(MemberTable.orgID, orgID), eq(MemberTable.userID, userID))),
      );
    }

    const cookie = await seal({ userID, email });
    return { userID, email, orgID, role, cookie };
  });
}
