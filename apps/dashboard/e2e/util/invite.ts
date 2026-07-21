import { Database } from "@template/core/drizzle";
import { Actor } from "@template/core/actor";
import { Member } from "@template/core/organization/member";
import { Role } from "@template/core/organization/role";
import { Invitation } from "@template/core/organization/invitation";

// Creates an invitation as `uid` (owner from `mint`) and returns the accept
// token, so specs can drive /invite/[token] without reading email.
export function invite(uid: string, email: string, role = "Member") {
  return Database.provide(process.env.DATABASE_URL!, async () => {
    const membership = await Member.resolve({ userID: uid });
    return Actor.provide(
      "user",
      { userID: uid, orgID: membership?.orgID, permissions: membership?.permissions },
      async () => {
        const roleID = (await Role.list()).find((r) => r.name === role)!.id;
        await Invitation.create({ email, roleID });
        const invites = await Invitation.list();
        return invites.find((i) => i.email === email.toLowerCase())!.token;
      },
    );
  });
}
