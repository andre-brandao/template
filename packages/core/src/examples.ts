import { Identifier } from "./identifier";

export namespace Examples {
  export const Id = (prefix: keyof typeof Identifier.prefixes) =>
    `${Identifier.prefixes[prefix]}_XXXXXXXXXXXXXXXXXXXXXXXXX`;

  export const User = {
    id: Id("user"),
    name: "John Doe",
    email: "john@example.com",
    emailVerified: true,
    image: null,
  };

  export const Project = {
    id: Id("project"),
    createdBy: Id("user"),
    name: "Quarterly close",
    description: null,
  } as const;

  export const Todo = {
    id: Id("todo"),
    createdBy: Id("user"),
    assignee: { id: Id("user"), name: "John Doe", image: null },
    source: "project",
    sourceID: Id("project"),
    stage: "Sprint 1",
    title: "Write the quarterly report",
    body: null,
    status: "active",
    reason: null,
    tags: [] as string[],
    startDate: "2026-06-07T00:00:00.000Z",
    dueDate: "2026-06-14T00:00:00.000Z",
    timeStarted: "2026-06-07T09:12:00.000Z",
    timeDone: null,
  } as const;

  export const Key = {
    id: Id("key"),
    name: "laptop",
    key: "sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    display: "sk-XXXX...XXXX",
    timeUsed: null,
    expiresAt: null,
    current: false,
  } as const;

  export const File = {
    key: `${Id("user")}/screenshot.png`,
    size: 102400,
    lastModified: "2026-06-07T00:00:00.000Z",
  } as const;

  export const Event = {
    id: Id("event"),
    userID: Id("user"),
    type: "todo.created",
    source: "todo",
    sourceID: Id("todo"),
    tags: ["actor:user"],
    data: { title: "Write the quarterly report" },
    timeCreated: "2026-06-07T00:00:00.000Z",
  } as const;
}
