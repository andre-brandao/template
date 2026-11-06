import type { Project } from "../project";

/** The annotation keys the GitHub sync owns, and the values they hold. */
export namespace Annotation {
  export const Keys = {
    issue: "github.com/issue",
    id: "github.com/issue-id",
    repos: "github.com/repos",
    project: "github.com/project",
  } as const;

  /** "owner/name#12" → its parts. Null for anything else. */
  export function issue(ref?: string) {
    const match = ref?.match(/^([\w.-]+)\/([\w.-]+)#(\d+)$/);
    if (!match) return null;
    return { owner: match[1]!, repo: match[2]!, number: Number(match[3]) };
  }
  export type Ref = NonNullable<ReturnType<typeof issue>>;

  /** "owner/a,owner/b" → the list, lowercased since GitHub names are case-insensitive. */
  export function list(value?: string) {
    return [
      ...new Set(
        (value ?? "")
          .split(",")
          .map((name) => name.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  }

  /** The repos a project is connected to. */
  export function repos(project: Pick<Project.Info, "metadata">) {
    return list(project.metadata.annotations[Keys.repos]);
  }
}
