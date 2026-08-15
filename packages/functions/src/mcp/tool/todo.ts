import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Todo } from "@template/core/todo";
import { Project } from "@template/core/project";
import { text } from "../common";

export function todo(server: McpServer) {
  server.registerTool(
    "todo_list",
    {
      title: "List todos",
      description:
        "List todos, optionally narrowed by status, assignee, stage, owning entity or search. Paginated.",
      inputSchema: {
        search: z.string().optional(),
        status: Todo.Status.optional(),
        assignee: z.string().optional().describe('A user id, or "none" for unassigned.'),
        stage: z.string().optional().describe('A stage name, or "none" for todos without one.'),
        source: z.string().optional().describe('The owning entity type, e.g. "project".'),
        sourceID: z.string().optional(),
        page: z.number().min(1).optional(),
        pageSize: z.number().min(1).max(100).optional(),
      },
    },
    async (input) => text(await Todo.list(input)),
  );

  server.registerTool(
    "todo_get",
    {
      title: "Get todo",
      description: "Fetch a single todo by id.",
      inputSchema: { id: z.string() },
    },
    async (input) => text(await Todo.fromID(input.id)),
  );

  server.registerTool(
    "todo_stages",
    {
      title: "List stages",
      description:
        "The stage labels in use, with the span and counts derived from the todos in each. Call before staging a todo so labels stay consistent.",
      inputSchema: Todo.stages.schema.shape,
    },
    async (input) => text(await Todo.stages(input)),
  );

  server.registerTool(
    "todo_create",
    {
      title: "Create todo",
      description:
        'Create a todo. Attach it to an entity with source/sourceID (e.g. source "project"), and give it a stage, assignee and planned dates to place it on the timeline.',
      inputSchema: Todo.create.schema.shape,
    },
    async (input) => text(await Todo.create(input)),
  );

  server.registerTool(
    "todo_update",
    {
      title: "Update todo",
      description:
        "Update a todo's title, body, tags, stage, assignee, planned dates or status. Moving to `active` stamps the real start; `done` stamps the end.",
      inputSchema: Todo.update.schema.shape,
    },
    async (input) => {
      await Todo.update(input);
      return text(await Todo.fromID(input.id));
    },
  );

  server.registerTool(
    "todo_rename_stage",
    {
      title: "Rename stage",
      description: "Rename a stage across every todo wearing it.",
      inputSchema: Todo.rename.schema.shape,
    },
    async (input) => {
      await Todo.rename(input);
      return text(await Todo.stages(input));
    },
  );

  server.registerTool(
    "todo_remove",
    {
      title: "Delete todo",
      description: "Soft-delete a todo.",
      inputSchema: { id: z.string() },
    },
    async (input) => {
      await Todo.remove(input.id);
      return text("ok");
    },
  );

  server.registerTool(
    "project_list",
    {
      title: "List projects",
      description: 'List projects. Use a project id as `sourceID` (with source "project").',
      inputSchema: Project.list.schema.shape,
    },
    async (input) => text(await Project.list(input)),
  );

  server.registerTool(
    "project_create",
    {
      title: "Create project",
      description: "Create a project to hang todos off.",
      inputSchema: Project.create.schema.shape,
    },
    async (input) => text(await Project.create(input)),
  );
}
