import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { fn } from "../util/fn";
import { Actor } from "../actor";
import { Common } from "../common";
import { Database } from "../drizzle";
import { Event } from "../event";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { OrganizationTable } from "./organization.sql";
import { RoleTable } from "./role.sql";
import { MemberTable } from "./member.sql";
import { Permission } from "./permission";

export namespace Organization {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Organization.id }),
      name: z.string().min(1),
    })
    .meta({
      ref: "Organization",
      description: "An organization users belong to through members.",
      example: Examples.Organization,
    });
  export type Info = z.infer<typeof Info>;

  /** Creates an organization owned by the current user. */
  export const create = fn(z.object({ name: Info.shape.name }), (input) =>
    Database.transaction(async () => {
      const orgID = await seed(Actor.userID(), input.name);
      await Event.create({
        type: "organization.created",
        source: "organization",
        sourceID: orgID,
        tags: [`org:${orgID}`],
        data: { name: input.name },
      });
      return orgID;
    }),
  );

  /**
   * Actorless variant for provisioning — seeds the personal organization for a
   * brand-new user before any actor exists.
   */
  export const init = fn(
    z.object({ userID: Identifier.schema("user"), name: Info.shape.name }),
    (input) => seed(input.userID, input.name),
  );

  /** Inserts the org, its default roles, and an owner membership in one transaction. */
  function seed(userID: string, name: string) {
    return Database.transaction(async (tx) => {
      const orgID = Identifier.create("organization");
      const ownerID = Identifier.create("role");
      await tx.insert(OrganizationTable).values({ id: orgID, name });
      await tx.insert(RoleTable).values([
        { id: ownerID, orgID, name: "Owner", permissions: ["*"], owner: true },
        {
          id: Identifier.create("role"),
          orgID,
          name: "Member",
          permissions: ["todo:read", "todo:write", "file:read", "file:write", "member:read"],
        },
      ]);
      await tx.insert(MemberTable).values({
        id: Identifier.create("member"),
        orgID,
        userID,
        roleID: ownerID,
      });
      return orgID;
    });
  }

  /** Every organization the current user is a member of. */
  export const list = fn(z.void(), () =>
    Database.use((tx) =>
      tx
        .select({ id: OrganizationTable.id, name: OrganizationTable.name })
        .from(MemberTable)
        .innerJoin(OrganizationTable, eq(OrganizationTable.id, MemberTable.orgID))
        .where(and(eq(MemberTable.userID, Actor.userID()), isNull(OrganizationTable.timeDeleted)))
        .orderBy(MemberTable.timeCreated),
    ),
  );

  export const fromID = fn(Info.shape.id, (id) =>
    Database.use((tx) =>
      tx
        .select({ id: OrganizationTable.id, name: OrganizationTable.name })
        .from(MemberTable)
        .innerJoin(OrganizationTable, eq(OrganizationTable.id, MemberTable.orgID))
        .where(
          and(
            eq(MemberTable.userID, Actor.userID()),
            eq(OrganizationTable.id, id),
            isNull(OrganizationTable.timeDeleted),
          ),
        )
        .then((rows) => rows.at(0) ?? null),
    ),
  );

  // Org deletion is deliberately out of scope: it needs cascading tenancy
  // cleanup and a "last org" story before it can exist.
  export const update = fn(z.object({ name: Info.shape.name }), async (input) => {
    Permission.assert("org:manage");
    return Database.transaction(async (tx) => {
      await tx
        .update(OrganizationTable)
        .set({ name: input.name, timeUpdated: new Date() })
        .where(eq(OrganizationTable.id, Actor.orgID()));
      await Event.create({
        type: "organization.updated",
        source: "organization",
        sourceID: Actor.orgID(),
        tags: [`org:${Actor.orgID()}`],
        data: { name: input.name },
      });
    });
  });
}
