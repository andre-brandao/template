import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { fn } from "../util/fn";
import { found, ErrorCodes, VisibleError } from "../error";
import { Actor } from "../actor";
import { Common } from "../common";
import { Database } from "../drizzle";
import { Email } from "../email";
import { Event } from "../event";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { Log } from "../util/log";
import { UserTable } from "../user/user.sql";
import { InvitationTable } from "./invitation.sql";
import { MemberTable } from "./member.sql";
import { OrganizationTable } from "./organization.sql";
import { RoleTable } from "./role.sql";
import { Permission } from "./permission";

export namespace Invitation {
  const log = Log.create({ namespace: "invitation" });

  const TTL = 7 * 24 * 60 * 60 * 1000;
  const APP = process.env.APP_URL ?? "http://localhost:5173";

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Invitation.id }),
      email: z.email(),
      roleID: z.string(),
      status: z.enum(["pending", "accepted", "revoked"]),
      /** The emailed secret, exposed so managers can copy the accept link. */
      token: z.string(),
      timeExpires: z.iso.datetime(),
    })
    .meta({
      ref: "Invitation",
      description: "A pending invite to join an organization with a given role.",
      example: Examples.Invitation,
    });
  export type Info = z.infer<typeof Info>;

  export const create = fn(
    z.object({ email: Info.shape.email, roleID: z.string() }),
    async (input) => {
      Permission.assert("invite:manage");
      const email = input.email.toLowerCase();
      return Database.transaction(async (tx) => {
        const org = found(
          "Organization",
          await tx
            .select({ name: OrganizationTable.name })
            .from(OrganizationTable)
            .where(eq(OrganizationTable.id, Actor.orgID()))
            .then((rows) => rows.at(0)),
        );
        found(
          "Role",
          await tx
            .select({ id: RoleTable.id })
            .from(RoleTable)
            .where(and(eq(RoleTable.id, input.roleID), eq(RoleTable.orgID, Actor.orgID())))
            .then((rows) => rows.at(0)),
        );
        const taken = await tx
          .select({ id: MemberTable.id })
          .from(MemberTable)
          .innerJoin(UserTable, eq(UserTable.id, MemberTable.userID))
          .where(and(eq(MemberTable.orgID, Actor.orgID()), eq(UserTable.email, email)))
          .then((rows) => rows.length > 0);
        if (taken)
          throw new VisibleError(
            "validation",
            ErrorCodes.Validation.ALREADY_EXISTS,
            `${email} is already a member`,
          );
        const pending = await tx
          .select({ id: InvitationTable.id })
          .from(InvitationTable)
          .where(
            and(
              eq(InvitationTable.orgID, Actor.orgID()),
              eq(InvitationTable.email, email),
              eq(InvitationTable.status, "pending"),
            ),
          )
          .then((rows) => rows.length > 0);
        if (pending)
          throw new VisibleError(
            "validation",
            ErrorCodes.Validation.ALREADY_EXISTS,
            `${email} already has a pending invitation`,
          );
        const token = secret();
        const id = Identifier.create("invitation");
        await tx.insert(InvitationTable).values({
          id,
          orgID: Actor.orgID(),
          email,
          roleID: input.roleID,
          inviterID: Actor.userID(),
          token,
          timeExpires: new Date(Date.now() + TTL),
        });
        await Event.create({
          type: "invitation.created",
          source: "invitation",
          sourceID: id,
          tags: [`org:${Actor.orgID()}`],
          data: { email, roleID: input.roleID },
        });
        // After commit; a failed email must not roll back the invitation —
        // the manager can still copy the link from the list.
        await Database.effect(() =>
          Email.send({
            to: email,
            subject: `You've been invited to ${org.name}`,
            body: `You've been invited to join ${org.name}. Accept the invitation: ${APP}/invite/${token}`,
          }).catch((err) =>
            log.warn("invite email failed", {
              err: err instanceof Error ? err.message : String(err),
            }),
          ),
        );
        return id;
      });
    },
  );

  /** Pending invitations for the current org. */
  export const list = fn(z.void(), async () => {
    Permission.assert("invite:manage");
    return Database.use((tx) =>
      tx
        .select({
          id: InvitationTable.id,
          email: InvitationTable.email,
          roleID: InvitationTable.roleID,
          status: InvitationTable.status,
          token: InvitationTable.token,
          timeExpires: InvitationTable.timeExpires,
        })
        .from(InvitationTable)
        .where(and(eq(InvitationTable.orgID, Actor.orgID()), eq(InvitationTable.status, "pending")))
        .orderBy(InvitationTable.timeCreated)
        .then((rows) => rows.map(serialize)),
    );
  });

  export const revoke = fn(Info.shape.id, async (id) => {
    Permission.assert("invite:manage");
    return Database.transaction(async (tx) => {
      const invite = found(
        "Invitation",
        await tx
          .update(InvitationTable)
          .set({ status: "revoked", timeUpdated: new Date() })
          .where(
            and(
              eq(InvitationTable.id, id),
              eq(InvitationTable.orgID, Actor.orgID()),
              eq(InvitationTable.status, "pending"),
            ),
          )
          .returning({ id: InvitationTable.id, email: InvitationTable.email })
          .then((rows) => rows.at(0)),
      );
      await Event.create({
        type: "invitation.revoked",
        source: "invitation",
        sourceID: id,
        tags: [`org:${Actor.orgID()}`],
        data: { email: invite.email },
      });
    });
  });

  /** Public — the token is the secret. Feeds the accept page. */
  export const fromToken = fn(z.string(), (token) =>
    Database.use((tx) =>
      tx
        .select({
          org: OrganizationTable.name,
          email: InvitationTable.email,
          status: InvitationTable.status,
          timeExpires: InvitationTable.timeExpires,
        })
        .from(InvitationTable)
        .innerJoin(OrganizationTable, eq(OrganizationTable.id, InvitationTable.orgID))
        .where(eq(InvitationTable.token, token))
        .then((rows) => {
          const row = rows.at(0);
          if (!row) return null;
          return {
            org: row.org,
            email: row.email,
            status: row.status,
            expired: row.timeExpires < new Date(),
          };
        }),
    ),
  );

  /**
   * Joins the current user to the invitation's org. The actor's email must match
   * the invited address. Idempotent when already a member. Returns the orgID so
   * callers can switch the session to it.
   */
  export const accept = fn(z.string(), (token) =>
    Database.transaction(async (tx) => {
      const invite = found(
        "Invitation",
        await tx
          .select()
          .from(InvitationTable)
          .where(eq(InvitationTable.token, token))
          .then((rows) => rows.at(0)),
      );
      if (invite.status !== "pending")
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.INVALID_STATE,
          "The invitation is no longer valid",
        );
      if (invite.timeExpires < new Date())
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.INVALID_STATE,
          "The invitation has expired",
        );
      const user = found(
        "User",
        await tx
          .select({ id: UserTable.id, email: UserTable.email })
          .from(UserTable)
          .where(eq(UserTable.id, Actor.userID()))
          .then((rows) => rows.at(0)),
      );
      if (user.email.toLowerCase() !== invite.email)
        throw new VisibleError(
          "forbidden",
          ErrorCodes.Permission.FORBIDDEN,
          `The invitation was sent to ${invite.email}`,
        );
      const member = await tx
        .select({ id: MemberTable.id })
        .from(MemberTable)
        .where(and(eq(MemberTable.orgID, invite.orgID), eq(MemberTable.userID, user.id)))
        .then((rows) => rows.length > 0);
      if (!member)
        await tx.insert(MemberTable).values({
          id: Identifier.create("member"),
          orgID: invite.orgID,
          userID: user.id,
          roleID: invite.roleID,
        });
      await tx
        .update(InvitationTable)
        .set({ status: "accepted", timeUpdated: new Date() })
        .where(eq(InvitationTable.id, invite.id));
      await Event.create({
        type: "invitation.accepted",
        source: "invitation",
        sourceID: invite.id,
        tags: [`org:${invite.orgID}`],
        data: { email: invite.email },
      });
      return invite.orgID;
    }),
  );

  function secret() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  function serialize(row: {
    id: string;
    email: string;
    roleID: string;
    status: string;
    token: string;
    timeExpires: Date;
  }): Info {
    return {
      id: row.id,
      email: row.email,
      roleID: row.roleID,
      status: row.status as Info["status"],
      token: row.token,
      timeExpires: row.timeExpires.toISOString(),
    };
  }
}
