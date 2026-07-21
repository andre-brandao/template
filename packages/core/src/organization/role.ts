import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { fn } from "../util/fn";
import { found, ErrorCodes, VisibleError } from "../error";
import { Actor } from "../actor";
import { Common } from "../common";
import { Database } from "../drizzle";
import { Event } from "../event";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { KeyTable } from "../key/key.sql";
import { RoleTable } from "./role.sql";
import { MemberTable } from "./member.sql";
import { InvitationTable } from "./invitation.sql";
import { Permission } from "./permission";

export namespace Role {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Role.id }),
      name: z.string().min(1).max(255),
      // Output allows "*" (the seeded owner role); input never does — see create/update.
      permissions: z.string().array(),
      owner: z.boolean().meta({ description: "The seeded owner role — cannot be edited or removed." }),
    })
    .meta({
      ref: "Role",
      description: "A role grouping permissions, assignable to members of an organization.",
      example: Examples.Role,
    });
  export type Info = z.infer<typeof Info>;

  export const list = fn(z.void(), async () => {
    Permission.assert("member:read");
    return Database.use((tx) =>
      tx
        .select({
          id: RoleTable.id,
          name: RoleTable.name,
          permissions: RoleTable.permissions,
          owner: RoleTable.owner,
        })
        .from(RoleTable)
        .where(eq(RoleTable.orgID, Actor.orgID()))
        .orderBy(RoleTable.timeCreated),
    );
  });

  export const create = fn(
    z.object({ name: Info.shape.name, permissions: Permission.Info.array() }),
    async (input) => {
      Permission.assert("role:manage");
      const id = Identifier.create("role");
      await Database.transaction(async (tx) => {
        await tx.insert(RoleTable).values({
          id,
          orgID: Actor.orgID(),
          name: input.name,
          permissions: input.permissions,
        });
        await Event.create({
          type: "role.created",
          source: "role",
          sourceID: id,
          tags: [`org:${Actor.orgID()}`],
          data: { name: input.name, permissions: input.permissions },
        });
      });
      return id;
    },
  );

  export const update = fn(
    z.object({
      id: Info.shape.id,
      name: Info.shape.name.optional(),
      permissions: Permission.Info.array().optional(),
    }),
    async (input) => {
      Permission.assert("role:manage");
      return Database.transaction(async (tx) => {
        const role = found("Role", await fromID(tx, input.id));
        if (role.owner)
          throw new VisibleError(
            "validation",
            ErrorCodes.Validation.INVALID_STATE,
            "The owner role cannot be edited",
          );
        await tx
          .update(RoleTable)
          .set({ name: input.name, permissions: input.permissions, timeUpdated: new Date() })
          .where(eq(RoleTable.id, input.id));
        await Event.create({
          type: "role.updated",
          source: "role",
          sourceID: input.id,
          tags: [`org:${Actor.orgID()}`],
          data: { name: input.name ?? null, permissions: input.permissions ?? null },
        });
      });
    },
  );

  export const remove = fn(Info.shape.id, async (id) => {
    Permission.assert("role:manage");
    return Database.transaction(async (tx) => {
      const role = found("Role", await fromID(tx, id));
      if (role.owner)
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.INVALID_STATE,
          "The owner role cannot be removed",
        );
      const used = await tx
        .select({ id: MemberTable.id })
        .from(MemberTable)
        .where(eq(MemberTable.roleID, id))
        .limit(1)
        .then((rows) => rows.length > 0);
      const invited = await tx
        .select({ id: InvitationTable.id })
        .from(InvitationTable)
        .where(and(eq(InvitationTable.roleID, id), eq(InvitationTable.status, "pending")))
        .limit(1)
        .then((rows) => rows.length > 0);
      const keyed = await tx
        .select({ id: KeyTable.id })
        .from(KeyTable)
        .where(and(eq(KeyTable.roleID, id), isNull(KeyTable.timeDeleted)))
        .limit(1)
        .then((rows) => rows.length > 0);
      if (used || invited || keyed)
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.IN_USE,
          "The role is still assigned to members, pending invitations, or API keys",
        );
      await tx.delete(RoleTable).where(eq(RoleTable.id, id));
      await Event.create({
        type: "role.removed",
        source: "role",
        sourceID: id,
        tags: [`org:${Actor.orgID()}`],
        data: { name: role.name },
      });
    });
  });

  function fromID(tx: Database.TxOrDb, id: string) {
    return tx
      .select({ id: RoleTable.id, name: RoleTable.name, owner: RoleTable.owner })
      .from(RoleTable)
      .where(and(eq(RoleTable.id, id), eq(RoleTable.orgID, Actor.orgID())))
      .then((rows) => rows.at(0));
  }
}
