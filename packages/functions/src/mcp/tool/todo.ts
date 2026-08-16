import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Todo } from "@template/core/todo";
import { Project } from "@template/core/project";
import { tools } from "../common";

export function todo(server: McpServer) {
  const tool = tools(server);

  tool("todo_list", Todo.list);
  tool.id("todo_get", Todo.fromID);
  tool("todo_stages", Todo.stages);
  tool("todo_create", Todo.create);

  tool("todo_update", Todo.update, async (input) => {
    await Todo.update(input);
    return Todo.fromID(input.id);
  });

  tool("todo_rename_stage", Todo.rename, async (input) => {
    await Todo.rename(input);
    return Todo.stages(input);
  });

  tool.id("todo_remove", Todo.remove, async (id) => {
    await Todo.remove(id);
    return "ok";
  });

  tool("project_list", Project.list);
  tool("project_create", Project.create);
}
