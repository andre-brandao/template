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
    status: "pending",
    dueDate: null,
  } as const;

  export const Key = {
    id: Id("key"),
    type: "api",
    name: "laptop",
    key: "sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    display: "sk-XXXX...XXXX",
    timeUsed: null,
    expiresAt: null,
    current: false,
  } as const;
}
