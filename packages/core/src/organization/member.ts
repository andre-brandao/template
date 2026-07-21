import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { fn } from "../util/fn";
import { found, ErrorCodes, VisibleError } from "../error";
import { Actor } from "../actor";
import { Common } from "../common";
import { Database } from "../drizzle";
import { Event } from "../event";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { UserTable } from "../user/user.sql";
import { MemberTable } from "./member.sql";
import { RoleTable } from "./role.sql";
import { Permission } from "./permission";

export namespace Member {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Member.id }),
      userID: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      roleID: z.string(),
      role: z.object({ name: z.string(), owner: z.boolean() }),
    })
    .meta({
      ref: "Member",
      description: "A user's membership in an organization, carrying their role.",
      example: Examples.Member,
    });
  export type Info = z.infer<typeof Info>;

  /**
   * Resolves a user's membership before an actor exists — called from request
   * hooks/middleware. Prefers `orgID` when given; falls back to the user's first
   * membership when the requested org yields none (revoked access, stale cookie).
   */
  export const resolve = fn(
    z.object({ userID: Identifier.schema("user"), orgID: z.string().optional() }),
    async (input) => {
      const membership = (org?: string) =>
        Database.use((tx) =>
          tx
            .select({
              orgID: MemberTable.orgID,
              roleID: MemberTable.roleID,
              permissions: RoleTable.permissions,
            })
            .from(MemberTable)
            .innerJoin(RoleTable, eq(RoleTable.id, MemberTable.roleID))
            .where(
              and(
                eq(MemberTable.userID, input.userID),
                org ? eq(MemberTable.orgID, org) : undefined,
              ),
            )
            .orderBy(MemberTable.timeCreated)
            .limit(1)
            .then((rows) => rows.at(0) ?? null),
        );
      return (await membership(input.orgID)) ?? (input.orgID ? membership() : null);
    },
  );

  export const list = fn(z.void(), async () => {
    Permission.assert("member:read");
    return Database.use((tx) =>
      tx
        .select({
          id: MemberTable.id,
          userID: MemberTable.userID,
          name: UserTable.name,
          email: UserTable.email,
          image: UserTable.image,
          roleID: MemberTable.roleID,
          role: { name: RoleTable.name, owner: RoleTable.owner },
        })
        .from(MemberTable)
        .innerJoin(UserTable, eq(UserTable.id, MemberTable.userID))
        .innerJoin(RoleTable, eq(RoleTable.id, MemberTable.roleID))
        .where(eq(MemberTable.orgID, Actor.orgID()))
        .orderBy(MemberTable.timeCreated),
    );
  });

  export const assign = fn(
    z.object({ id: Info.shape.id, roleID: z.string() }),
    async (input) => {
      Permission.assert("member:manage");
      return Database.transaction(async (tx) => {
        const member = found("Member", await fromID(tx, input.id));
        if (member.userID === Actor.userID())
          throw new VisibleError(
            "validation",
            ErrorCodes.Validation.INVALID_STATE,
            "You cannot change your own role",
          );
        const role = found(
          "Role",
          await tx
            .select({ owner: RoleTable.owner })
            .from(RoleTable)
            .where(and(eq(RoleTable.id, input.roleID), eq(RoleTable.orgID, Actor.orgID())))
            .then((rows) => rows.at(0)),
        );
        if (member.owner && !role.owner) await guard(tx);
        await tx
          .update(MemberTable)
          .set({ roleID: input.roleID, timeUpdated: new Date() })
          .where(eq(MemberTable.id, input.id));
        await Event.create({
          type: "member.assigned",
          source: "member",
          sourceID: input.id,
          tags: [`org:${Actor.orgID()}`],
          data: { userID: member.userID, roleID: input.roleID },
        });
      });
    },
  );

  export const remove = fn(Info.shape.id, async (id) => {
    Permission.assert("member:manage");
    return Database.transaction(async (tx) => {
      const member = found("Member", await fromID(tx, id));
      if (member.userID === Actor.userID())
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.INVALID_STATE,
          "Leave the organization instead of removing yourself",
        );
      if (member.owner) await guard(tx);
      await tx.delete(MemberTable).where(eq(MemberTable.id, id));
      await Event.create({
        type: "member.removed",
        source: "member",
        sourceID: id,
        tags: [`org:${Actor.orgID()}`],
        data: { userID: member.userID },
      });
    });
  });

  export const leave = fn(z.void(), () =>
    Database.transaction(async (tx) => {
      const member = found(
        "Member",
        await tx
          .select({ id: MemberTable.id, owner: RoleTable.owner })
          .from(MemberTable)
          .innerJoin(RoleTable, eq(RoleTable.id, MemberTable.roleID))
          .where(and(eq(MemberTable.orgID, Actor.orgID()), eq(MemberTable.userID, Actor.userID())))
          .then((rows) => rows.at(0)),
      );
      if (member.owner) await guard(tx);
      await tx.delete(MemberTable).where(eq(MemberTable.id, member.id));
      await Event.create({
        type: "member.left",
        source: "member",
        sourceID: member.id,
        tags: [`org:${Actor.orgID()}`],
        data: {},
      });
    }),
  );

  function fromID(tx: Database.TxOrDb, id: string) {
    return tx
      .select({ id: MemberTable.id, userID: MemberTable.userID, owner: RoleTable.owner })
      .from(MemberTable)
      .innerJoin(RoleTable, eq(RoleTable.id, MemberTable.roleID))
      .where(and(eq(MemberTable.id, id), eq(MemberTable.orgID, Actor.orgID())))
      .then((rows) => rows.at(0));
  }

  /** Throws when the org would be left without an owner-role member. */
  async function guard(tx: Database.TxOrDb) {
    const owners = await tx
      .select({ id: MemberTable.id })
      .from(MemberTable)
      .innerJoin(RoleTable, eq(RoleTable.id, MemberTable.roleID))
      .where(and(eq(MemberTable.orgID, Actor.orgID()), eq(RoleTable.owner, true)))
      .limit(2)
      .then((rows) => rows.length);
    if (owners > 1) return;
    throw new VisibleError(
      "validation",
      ErrorCodes.Validation.INVALID_STATE,
      "The organization needs at least one owner",
    );
  }
}
