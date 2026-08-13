/**
 * Authorization vocabulary and roles. Dependency-free so the browser bundle can grey
 * out controls with the same rules the server enforces.
 */
export namespace Permission {
  /** Every resource and its base actions. `:own` is a derived modifier, never listed here. */
  export const Statement = {
    // The admin area itself. Its own resource because `member` legitimately holds
    // `user: ["read"]` for the assignee picker, and that must not open the back office.
    admin: ["read"],
    user: ["read", "create", "update", "delete", "assign"],
    project: ["read", "create", "update", "delete"],
    todo: ["read", "create", "update", "delete"],
    key: ["read", "create", "update", "delete"],
  } as const;

  type Res = keyof typeof Statement;
  type Act<R extends Res> = (typeof Statement)[R][number];

  /** What a caller asks for. Base actions only — you never *request* an own-scoped action. */
  export type Grants = { [R in Res]?: readonly Act<R>[] };

  /** What a role holds. `delete:own` narrows the action to rows the actor created. */
  type Held = { [R in Res]?: readonly (Act<R> | `${Act<R>}:own`)[] };

  /** `member` stays permissive on projects/todos (shared workspace); tighten to `:own` here. */
  export const Roles = {
    admin: {
      admin: ["read"],
      user: ["read", "create", "update", "delete", "assign"],
      project: ["read", "create", "update", "delete"],
      todo: ["read", "create", "update", "delete"],
      key: ["read", "create", "update", "delete"],
    },
    member: {
      user: ["read", "update:own"],
      project: ["read", "create", "update", "delete"],
      todo: ["read", "create", "update", "delete"],
      key: ["read:own", "create", "delete:own"],
    },
  } as const satisfies Record<string, Held>;

  export type Role = keyof typeof Roles;

  /** Non-empty tuple, for `z.enum` and the drizzle `$type`. */
  export const roles = Object.keys(Roles) as [Role, ...Role[]];

  /** True when `role` holds every listed action. `owned` unlocks the `:own` variants. */
  export function can(role: Role | undefined, grants: Grants, owned = false) {
    if (!role) return false;
    const held: any = Roles[role];
    return Object.entries(grants).every(([res, acts]: [string, any]) =>
      (acts ?? []).every(
        (a: string) => held[res]?.includes(a) || (owned && held[res]?.includes(`${a}:own`)),
      ),
    );
  }
}
