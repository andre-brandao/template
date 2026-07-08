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
}
