// fallow-ignore-file code-duplication
import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { Result, validator, ErrorResponses, authRequired, orgRequired, OrgHeader } from "../common";
import { Organization } from "@template/core/organization";
import { Member } from "@template/core/organization/member";
import { Role } from "@template/core/organization/role";
import { Invitation } from "@template/core/organization/invitation";
import { Permission } from "@template/core/organization/permission";
import { Examples } from "@template/core/examples";

export namespace OrganizationApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Organization"],
        summary: "List organizations",
        description:
          "List the organizations the current user belongs to. Org-scoped routes name one of them with the `X-Org-ID` header.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(Organization.Info.array()),
                example: [Examples.Organization],
              },
            },
            description: "The user's organizations.",
          },
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      async (c) => c.json(await Organization.list(), 200),
    )
    .post(
      "/",
      describeRoute({
        tags: ["Organization"],
        summary: "Create organization",
        description: "Create an organization owned by the current user, with default roles seeded.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.string()) } },
            description: "The new organization id.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("json", z.object({ name: Organization.Info.shape.name })),
      async (c) => c.json(await Organization.create(c.req.valid("json")), 200),
    )
    .patch(
      "/",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "Update organization",
        description: "Rename the active organization. Requires the `org:manage` permission.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Updated.",
          },
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      validator("json", z.object({ name: Organization.Info.shape.name })),
      async (c) => {
        await Organization.update(c.req.valid("json"));
        return c.json("ok" as const, 200);
      },
    )
    .get(
      "/member",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "List members",
        description: "List members of the active organization. Requires `member:read`.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(Member.Info.array()),
                example: [Examples.Member],
              },
            },
            description: "The organization's members.",
          },
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      async (c) => c.json(await Member.list(), 200),
    )
    .patch(
      "/member/:id",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "Assign role",
        description: "Assign a role to a member. Requires `member:manage`.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Assigned.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      validator("param", z.object({ id: z.string() })),
      validator("json", z.object({ roleID: z.string() })),
      async (c) => {
        await Member.assign({ id: c.req.valid("param").id, roleID: c.req.valid("json").roleID });
        return c.json("ok" as const, 200);
      },
    )
    .delete(
      "/member/:id",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "Remove member",
        description: "Remove a member from the active organization. Requires `member:manage`.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Removed.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        await Member.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    )
    .get(
      "/role",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "List roles",
        description: "List the active organization's roles. Requires `member:read`.",
        responses: {
          200: {
            content: {
              "application/json": { schema: Result(Role.Info.array()), example: [Examples.Role] },
            },
            description: "The organization's roles.",
          },
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      async (c) => c.json(await Role.list(), 200),
    )
    .post(
      "/role",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "Create role",
        description: `Create a custom role. Requires \`role:manage\`. Permissions: ${Permission.all.join(", ")}.`,
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.string()) } },
            description: "The new role id.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      validator(
        "json",
        z.object({ name: Role.Info.shape.name, permissions: Permission.Info.array() }),
      ),
      async (c) => c.json(await Role.create(c.req.valid("json")), 200),
    )
    .patch(
      "/role/:id",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "Update role",
        description: "Rename a role or change its permissions. Requires `role:manage`.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Updated.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      validator("param", z.object({ id: z.string() })),
      validator(
        "json",
        z.object({
          name: Role.Info.shape.name.optional(),
          permissions: Permission.Info.array().optional(),
        }),
      ),
      async (c) => {
        await Role.update({ id: c.req.valid("param").id, ...c.req.valid("json") });
        return c.json("ok" as const, 200);
      },
    )
    .delete(
      "/role/:id",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "Remove role",
        description: "Delete an unused role. Requires `role:manage`.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Removed.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        await Role.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    )
    .get(
      "/invitation",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "List invitations",
        description: "List pending invitations. Requires `invite:manage`.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(Invitation.Info.array()),
                example: [Examples.Invitation],
              },
            },
            description: "Pending invitations.",
          },
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      async (c) => c.json(await Invitation.list(), 200),
    )
    .post(
      "/invitation",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "Invite member",
        description:
          "Invite an email to join the active organization with a role. Requires `invite:manage`.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.string()) } },
            description: "The new invitation id.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      validator("json", z.object({ email: Invitation.Info.shape.email, roleID: z.string() })),
      async (c) => c.json(await Invitation.create(c.req.valid("json")), 200),
    )
    .delete(
      "/invitation/:id",
      describeRoute({
        tags: ["Organization"],
        parameters: [OrgHeader],
        summary: "Revoke invitation",
        description: "Revoke a pending invitation. Requires `invite:manage`.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Revoked.",
          },
          401: ErrorResponses[401],
          403: ErrorResponses[403],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      orgRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        await Invitation.revoke(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    );
}
