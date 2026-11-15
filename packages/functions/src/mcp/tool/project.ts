import type { McpServer } from "@modelcontextprotocol/server";
import { Project } from "@template/core/project";
import { tools } from "../common";

export function project(server: McpServer) {
  const tool = tools(server);
  const read = tools(server, { readOnlyHint: true });

  read("project_list", Project.list);
  read.id("project_get", Project.fromID);
  tool("project_create", Project.create);
  tool("project_update", Project.update);
  tool("project_annotate", Project.annotate);
  tool.id("project_remove", Project.remove, async (id) => {
    await Project.remove(id);
    return "ok";
  });
}
