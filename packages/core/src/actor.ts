import { Context } from "./context";
import { Log } from "./util/log";
import { Permission } from "./permission";
import { ErrorCodes, VisibleError } from "./error";

export namespace Actor {
  interface Public {
    type: "public";
    properties: {};
  }

  /** Trusted internal caller — queue jobs with no pusher, seeds, migrations. Skips every check. */
  interface System {
    type: "system";
    properties: {};
  }

  interface User {
    type: "user";
    properties: {
      userID: string;
      role: Permission.Role;
      /** IANA zone. Absent when whoever provided the actor had no way to know it. */
      timezone?: string;
    };
  }

  export type Info = Public | System | User;

  const ctx = Context.create<Info>();
  export const use = ctx.use;

  const log = Log.create().tag("namespace", "actor");

  export function provide<R, T extends Info["type"]>(
    type: T,
    properties: Extract<Info, { type: T }>["properties"],
    cb: () => R,
  ) {
    return ctx.provide(
      {
        type,
        properties,
      } as any,
      () => {
        return Log.provide({ ...properties }, () => {
          // log.info("provided");
          return cb();
        });
      },
    );
  }

  export function assert<T extends Info["type"]>(type: T) {
    const actor = use();
    if (actor.type !== type) {
      throw new Error(`Expected actor type ${type}, got ${actor.type}`);
    }
    return actor as Extract<Info, { type: T }>;
  }

  export function userID() {
    return Actor.assert("user").properties.userID;
  }

  /**
   * The zone to count this actor's days in. UTC unless the caller that provided the actor
   * knew better — a job and a system caller have no person to ask, and a `date_trunc` that
   * guessed the server's zone would be worse than one that says UTC out loud.
   */
  export function timezone() {
    const actor = use();
    if (actor.type !== "user") return "UTC";
    return actor.properties.timezone ?? "UTC";
  }

  /**
   * Every listed action must be held. `owner` is the row's `createdBy` — when it matches
   * the actor, the role's `:own` grants count too.
   */
  export function can(grants: Permission.Grants, owner?: string) {
    const actor = use();
    if (actor.type === "system") return true;
    if (actor.type !== "user") return false;
    return Permission.can(actor.properties.role, grants, owner === actor.properties.userID);
  }

  /** The throwing form. Surfaces as a 403 through `VisibleError.statusCode()`. */
  export function check(grants: Permission.Grants, owner?: string) {
    if (can(grants, owner)) return;
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.INSUFFICIENT_PERMISSIONS,
      `Requires ${Object.entries(grants)
        .map(([res, acts]) => `${res}:${(acts ?? []).join("/")}`)
        .join(", ")}`,
    );
  }
}
