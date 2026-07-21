import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Actor } from "../src/actor";
import { Database } from "../src/drizzle";
import { User } from "../src/user";
import { Organization } from "../src/organization";
import { Invitation } from "../src/organization/invitation";
import { InvitationTable } from "../src/organization/invitation.sql";
import { Member } from "../src/organization/member";
import { Permission } from "../src/organization/permission";
import { Role } from "../src/organization/role";
import { testEmail } from "./util";

async function user() {
  const email = testEmail();
  const userID = await User.create({ name: "Test User", email });
  return { userID, email };
}

/** Runs `cb` as `userID` with membership (org + permissions) resolved like the request hooks do. */
async function as<T>(userID: string, cb: () => Promise<T>, orgID?: string): Promise<T> {
  const membership = await Member.resolve({ userID, orgID });
  return Actor.provide(
    "user",
    {
      userID,
      orgID: membership?.orgID,
      permissions: membership?.permissions,
    },
    cb,
  );
}

function org(userID: string, name = "Acme") {
  return Actor.provide("user", { userID }, () => Organization.create({ name }));
}

/** Invites `email` with `role` and accepts as `userID`, returning the joined orgID. */
async function join(owner: string, orgID: string, email: string, userID: string, role: string) {
  const token = await as(
    owner,
    async () => {
      const roles = await Role.list();
      const roleID =
        roles.find((r) => r.name === role)?.id ??
        (await Role.create({ name: role, permissions: ["todo:read"] }));
      await Invitation.create({ email, roleID });
      const invites = await Invitation.list();
      return invites.find((i) => i.email === email)!.token;
    },
    orgID,
  );
  return as(userID, () => Invitation.accept(token));
}

describe("organization", () => {
  it("create seeds default roles and an owner membership", async () => {
    const owner = await user();
    const orgID = await org(owner.userID);
    await as(
      owner.userID,
      async () => {
        const roles = await Role.list();
        expect(roles.map((r) => r.name).sort()).toEqual(["Member", "Owner"]);
        expect(roles.find((r) => r.name === "Owner")?.permissions).toEqual(["*"]);
        const members = await Member.list();
        expect(members).toHaveLength(1);
        expect(members[0]?.role.owner).toBe(true);
        expect(Permission.has("org:manage")).toBe(true);
        expect((await Organization.list()).map((o) => o.id)).toContain(orgID);
      },
      orgID,
    );
  });

  it("resolve prefers the requested org and falls back to the first membership", async () => {
    const owner = await user();
    const orgID = await org(owner.userID);
    const direct = await Member.resolve({ userID: owner.userID, orgID });
    expect(direct?.orgID).toBe(orgID);
    const fallback = await Member.resolve({
      userID: owner.userID,
      orgID: "org_00000000000000000000000000",
    });
    expect(fallback?.orgID).toBe(orgID);
    const none = await Member.resolve({ userID: (await user()).userID });
    expect(none).toBeNull();
  });

  it("permissions gate write actions for limited roles", async () => {
    const owner = await user();
    const orgID = await org(owner.userID);
    const guest = await user();
    await join(owner.userID, orgID, guest.email, guest.userID, "Viewer");
    await as(
      guest.userID,
      async () => {
        expect(Permission.has("todo:read")).toBe(true);
        expect(Permission.has("role:manage")).toBe(false);
        await expect(Role.create({ name: "Nope", permissions: [] })).rejects.toMatchObject({
          code: "insufficient_permissions",
        });
        await expect(Organization.update({ name: "Hijacked" })).rejects.toMatchObject({
          code: "insufficient_permissions",
        });
      },
      orgID,
    );
  });

  it("the owner role cannot be edited or removed", async () => {
    const owner = await user();
    const orgID = await org(owner.userID);
    await as(
      owner.userID,
      async () => {
        const role = (await Role.list()).find((r) => r.owner)!;
        await expect(Role.update({ id: role.id, name: "Boss" })).rejects.toMatchObject({
          code: "invalid_state",
        });
        await expect(Role.remove(role.id)).rejects.toMatchObject({ code: "invalid_state" });
      },
      orgID,
    );
  });

  it("a role in use cannot be removed", async () => {
    const owner = await user();
    const orgID = await org(owner.userID);
    const guest = await user();
    await join(owner.userID, orgID, guest.email, guest.userID, "Viewer");
    await as(
      owner.userID,
      async () => {
        const role = (await Role.list()).find((r) => r.name === "Viewer")!;
        await expect(Role.remove(role.id)).rejects.toMatchObject({ code: "resource_in_use" });
      },
      orgID,
    );
  });

  it("member invariants protect the last owner and the actor", async () => {
    const owner = await user();
    const orgID = await org(owner.userID);
    const guest = await user();
    await join(owner.userID, orgID, guest.email, guest.userID, "Viewer");
    await as(
      owner.userID,
      async () => {
        const members = await Member.list();
        const self = members.find((m) => m.userID === owner.userID)!;
        const other = members.find((m) => m.userID === guest.userID)!;
        const viewer = (await Role.list()).find((r) => r.name === "Viewer")!;

        await expect(Member.assign({ id: self.id, roleID: viewer.id })).rejects.toMatchObject({
          code: "invalid_state",
        });
        await expect(Member.remove(self.id)).rejects.toMatchObject({ code: "invalid_state" });
        await expect(Member.leave()).rejects.toMatchObject({ code: "invalid_state" });

        const member = (await Role.list()).find((r) => r.name === "Member")!;
        await Member.assign({ id: other.id, roleID: member.id });
        expect((await Member.list()).find((m) => m.id === other.id)?.roleID).toBe(member.id);
      },
      orgID,
    );
    await as(guest.userID, () => Member.leave(), orgID);
    await as(owner.userID, async () => expect(await Member.list()).toHaveLength(1), orgID);
  });

  it("invitations reject duplicates, mismatched emails, and reuse", async () => {
    const owner = await user();
    const orgID = await org(owner.userID);
    const guest = await user();
    const stranger = await user();

    const token = await as(
      owner.userID,
      async () => {
        const roleID = (await Role.list()).find((r) => r.name === "Member")!.id;
        await Invitation.create({ email: guest.email, roleID });
        await expect(Invitation.create({ email: guest.email, roleID })).rejects.toMatchObject({
          code: "already_exists",
        });
        return (await Invitation.list()).find((i) => i.email === guest.email)!.token;
      },
      orgID,
    );

    const info = await Invitation.fromToken(token);
    expect(info).toMatchObject({ org: "Acme", email: guest.email, status: "pending" });

    await as(
      stranger.userID,
      async () =>
        await expect(Invitation.accept(token)).rejects.toMatchObject({ code: "forbidden" }),
    );

    expect(await as(guest.userID, () => Invitation.accept(token))).toBe(orgID);
    // Idempotent for an already-joined user.
    await as(guest.userID, () => Invitation.accept(token).catch(() => null));

    await as(
      owner.userID,
      async () => {
        const roleID = (await Role.list()).find((r) => r.name === "Member")!.id;
        await expect(Invitation.create({ email: guest.email, roleID })).rejects.toMatchObject({
          code: "already_exists",
        });
      },
      orgID,
    );
  });

  it("revoked and expired invitations cannot be accepted", async () => {
    const owner = await user();
    const orgID = await org(owner.userID);
    const guest = await user();

    await as(
      owner.userID,
      async () => {
        const roleID = (await Role.list()).find((r) => r.name === "Member")!.id;
        await Invitation.create({ email: guest.email, roleID });
        const invite = (await Invitation.list()).find((i) => i.email === guest.email)!;
        await Invitation.revoke(invite.id);
        await as(
          guest.userID,
          async () =>
            await expect(Invitation.accept(invite.token)).rejects.toMatchObject({
              code: "invalid_state",
            }),
        );

        await Invitation.create({ email: guest.email, roleID });
        const again = (await Invitation.list()).find((i) => i.email === guest.email)!;
        await Database.use((tx) =>
          tx
            .update(InvitationTable)
            .set({ timeExpires: new Date(Date.now() - 1000) })
            .where(eq(InvitationTable.id, again.id)),
        );
        await as(
          guest.userID,
          async () =>
            await expect(Invitation.accept(again.token)).rejects.toMatchObject({
              code: "invalid_state",
            }),
        );
      },
      orgID,
    );
  });
});
