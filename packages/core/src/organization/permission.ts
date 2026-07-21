import { z } from "zod";
import { Actor } from "../actor";
import { ErrorCodes, VisibleError } from "../error";

export namespace Permission {
  export const all = [
    "todo:read",
    "todo:write",
    "file:read",
    "file:write",
    "member:read",
    "member:manage",
    "role:manage",
    "invite:manage",
    "org:manage",
  ] as const;

  export const Info = z.enum(all);
  export type Info = z.infer<typeof Info>;

  /** `*` is the wildcard held only by the seeded owner role — never assignable to custom roles. */
  export function has(perm: Info) {
    const granted = Actor.permissions();
    return granted.includes("*") || granted.includes(perm);
  }

  export function assert(perm: Info) {
    if (has(perm)) return;
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.INSUFFICIENT_PERMISSIONS,
      `Missing permission ${perm}`,
    );
  }
}
