// fallow-ignore-file code-duplication
import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import {
  Result,
  validator,
  ErrorResponses,
  PaginatedQuery,
  PaginatedResponse,
  authRequired,
} from "../common";
import { Project } from "@template/core/project";
import { Examples } from "@template/core/examples";
import { found } from "@template/core/error";

export namespace ProjectApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Project"],
        summary: "List projects",
        description: "List projects, optionally filtered by name. Paginated.",
        responses: {
          200: PaginatedResponse(Project.Info, "A page of projects.", Examples.Project),
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("query", PaginatedQuery(Project.list.schema)),
      async (c) => {
        const projects = await Project.list(c.req.valid("query"));
        return c.json(projects, 200);
      },
    )
    .get(
      "/:id",
      describeRoute({
        tags: ["Project"],
        summary: "Get project",
        responses: {
          200: {
            content: {
              "application/json": { schema: Result(Project.Info), example: Examples.Project },
            },
            description: "The project.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: Project.Info.shape.id })),
      async (c) => {
        const project = found("Project", await Project.fromID(c.req.valid("param").id));
        return c.json(project, 200);
      },
    )
    .post(
      "/",
      describeRoute({
        tags: ["Project"],
        summary: "Create project",
        responses: {
          200: {
            content: {
              "application/json": { schema: Result(Project.Info), example: Examples.Project },
            },
            description: "The created project.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("json", Project.create.schema),
      async (c) => c.json(await Project.create(c.req.valid("json")), 200),
    )
    .patch(
      "/:id",
      describeRoute({
        tags: ["Project"],
        summary: "Update project",
        responses: {
          200: {
            content: {
              "application/json": { schema: Result(Project.Info), example: Examples.Project },
            },
            description: "The updated project.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: Project.Info.shape.id })),
      validator("json", Project.update.schema.omit({ id: true })),
      async (c) => {
        const { id } = c.req.valid("param");
        await Project.update({ id, ...c.req.valid("json") });
        const project = await Project.fromID(id);
        return c.json(project, 200);
      },
    )
    .delete(
      "/:id",
      describeRoute({
        tags: ["Project"],
        summary: "Delete project",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Deleted.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        await Project.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    );
}
