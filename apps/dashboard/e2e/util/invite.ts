import { Role } from "@template/core/organization/role";
import { Invitation } from "@template/core/organization/invitation";
import { actor } from "./actor";

// Creates an invitation as `uid` (owner from `mint`) and returns the accept
// token, so specs can drive /invite/[token] without reading email.
export function invite(uid: string, email: string, role = "Member") {
  return actor(uid, async () => {
    const roleID = (await Role.list()).find((r) => r.name === role)!.id;
    await Invitation.create({ email, roleID });
    const invites = await Invitation.list();
    return invites.find((i) => i.email === email.toLowerCase())!.token;
  });
}
