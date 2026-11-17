import { defineWorkspace, githubRepo, localSource } from "@tanstack/ai-sandbox";

export namespace Workspace {
  export const make = defineWorkspace;
  export const github = githubRepo;
  export const local = localSource;
}
