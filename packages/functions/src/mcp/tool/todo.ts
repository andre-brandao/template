import type { McpServer } from "@modelcontextprotocol/server";
import { Todo } from "@template/core/todo";
import { Project } from "@template/core/project";
import { tools } from "../common";

export function todo(server: McpServer) {
  const tool = tools(server);
  const read = tools(server, { readOnlyHint: true });

  read("todo_list", Todo.list);
  read.id("todo_get", Todo.fromID);
  read("todo_stages", Todo.stages);
  tool("todo_create", Todo.create);

  tool("todo_update", Todo.update, async (input) => {
    await Todo.update(input);
    return Todo.fromID(input.id);
  });

  tool("todo_move", Todo.move, async (input) => {
    await Todo.move(input);
    return Todo.fromID(input.id);
  });

  tool("todo_rename_stage", Todo.rename, async (input) => {
    await Todo.rename(input);
    return Todo.stages(input);
  });

  tool("todo_annotate", Todo.annotate);

  tool.id("todo_remove", Todo.remove, async (id) => {
    await Todo.remove(id);
    return "ok";
  });

  read("project_list", Project.list);
  tool("project_create", Project.create);
  tool("project_annotate", Project.annotate);
}
