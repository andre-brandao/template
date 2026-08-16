import { Identifier } from "./identifier";
import { DEFAULTS } from "./user/prefs";

export namespace Examples {
  export const Id = (prefix: keyof typeof Identifier.prefixes) =>
    `${Identifier.prefixes[prefix]}_XXXXXXXXXXXXXXXXXXXXXXXXX`;

  export const User = {
    id: Id("user"),
    name: "John Doe",
    email: "john@example.com",
    emailVerified: true,
    image: null,
    role: "member",
    prefs: DEFAULTS,
    timeDeleted: null,
  } as const;

  export const Project = {
    id: Id("project"),
    createdBy: Id("user"),
    name: "Quarterly close",
    description: null,
    image: null,
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

  export const Session = {
    userID: Id("user"),
    email: "john@example.com",
    role: "member",
    timezone: "America/Sao_Paulo",
  } as const;

  export const File = {
    key: `${Id("user")}/screenshot.png`,
    size: 102400,
    lastModified: "2026-06-07T00:00:00.000Z",
  } as const;

  export const Webhook = {
    id: Id("webhook"),
    url: "https://example.com/hooks/template",
    secret: "whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    display: "whsec_XXXX...XXXX",
    types: ["todo.created"],
    enabled: true,
    failures: 0,
    lastStatus: 200,
    timeDelivered: "2026-06-07T00:00:00.000Z",
    timeCreated: "2026-06-07T00:00:00.000Z",
  } as const;

  export const Event = {
    id: Id("event"),
    userID: Id("user"),
    user: { id: Id("user"), name: "John Doe", image: null },
    type: "todo.created",
    source: "todo",
    sourceID: Id("todo"),
    tags: ["actor:user"],
    data: { title: "Write the quarterly report" },
    timeCreated: "2026-06-07T00:00:00.000Z",
  } as const;
}
