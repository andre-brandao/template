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

  export const Todo = {
    id: Id("todo"),
    userID: Id("user"),
    title: "Write the quarterly report",
    body: null,
    state: "open",
    stateReason: null,
    tags: [] as string[],
    dueDate: null,
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
