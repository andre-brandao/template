import { z } from "zod";
import { Context } from "./context";
import { Log } from "./util/log";
import { Permission } from "./permission";
import { ErrorCodes, VisibleError } from "./error";

/**
 * Who is acting: a `user`, an `agent` for one, an App's `system` account, or the app's own
 * `internal` code. `Auth` turns credentials into one. Nothing skips checks, not even a seed.
 */
export namespace Identity {
  const id = z.string().meta({ description: "Who answers for the act." });
  const role = z.enum(Permission.roles).meta({ description: "The role held at the time." });
  const zone = z.string().optional().meta({ description: "IANA zone, when known." });
  const credential = z
    .string()
    .optional()
    .meta({ description: "The key or delegation that acted, so an audit can name it." });
  const grants = z
    .custom<Permission.Grants>((v) => typeof v === "object" && v !== null)
    .meta({ description: "Exactly what it may do." });

  /** A zod union, not just types, so an identity can be stored with what it did and read back. */
  export const Info = z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("public"), properties: z.object({}) }),
      z.object({
        type: z.literal("user"),
        properties: z.object({ userID: id, role, timezone: zone, credential }),
      }),
      // Software acting for a person: their role, narrowed to `scope` when one is set.
      z.object({
        type: z.literal("agent"),
        properties: z.object({
          name: z.string().meta({
            description: "Which agent: `copilot`, or an MCP client like `claude`.",
          }),
          userID: id,
          role,
          scope: grants.optional(),
          timezone: zone,
          credential,
        }),
      }),
      // An App's account (`kind: "system"` row), acting through its keys. Never more than its
      // owner: `can` checks both roles.
      z.object({
        type: z.literal("system"),
        properties: z.object({
          userID: id,
          role,
          owner: z
            .object({ userID: id, role })
            .meta({ description: "The person answerable for the App." }),
          credential,
        }),
      }),
      // The app's own code — signup, seeds, an integration's sync — holding exactly `scope`.
      // No account behind it, so it can make accounts but never own rows.
      z.object({
        type: z.literal("internal"),
        properties: z.object({
          name: z.string().meta({ description: "Which part of the app, like `auth` or `seed`." }),
          scope: grants,
        }),
      }),
    ])
    .meta({
      ref: "Identity",
      description: "Who acted: a person, an agent for one, an App, or the app itself.",
    });
  export type Info = z.infer<typeof Info>;
  export type Type = Info["type"];

  /**
   * What survives a queue hop. The role is left out on purpose: replay re-reads it off the row,
   * so a job can't outlive a demotion. An `internal` stamp is its whole identity.
   */
  export const Stamp = z.object({
    type: z.enum(["user", "agent", "system", "internal"]),
    userID: z.string().optional(),
    name: z.string().optional(),
    scope: grants.optional(),
    credential: z.string().optional(),
  });
  export type Stamp = z.infer<typeof Stamp>;

  const ctx = Context.create<Info>();
  export const use = ctx.use;

  export function provide<R, T extends Type>(
    type: T,
    properties: Extract<Info, { type: T }>["properties"],
    cb: () => R,
  ) {
    return ctx.provide({ type, properties } as Info, () => Log.provide({ ...properties }, cb));
  }

  /** The same, for an `Info` already in hand — what `Auth.resolve` returns. */
  export function enter<R>(info: Info, cb: () => R) {
    return ctx.provide(info, () => Log.provide({ ...info.properties }, cb));
  }

  /** Runs `cb` as the app's own `name` holding exactly `scope`, for acts like signup. */
  export function internal<R>(name: string, scope: Permission.Grants, cb: () => R) {
    return provide("internal", { name, scope }, cb);
  }

  /** Runs `cb` as agent `name` for the caller, narrowed to `grants`. Apps and public can't. */
  export function delegate<R>(name: string, grants: Permission.Grants | undefined, cb: () => R) {
    const info = ctx.peek() ?? { type: "public", properties: {} };
    if (info.type === "system") throw new Error(`An App can't delegate to ${name}`);
    if (info.type === "public") throw new Error(`Nobody to delegate to ${name} from`);
    const held = info.type === "user" ? undefined : info.properties.scope;
    if (held && grants && !Permission.within(held, grants))
      throw new Error(`${name} can't hold more than the identity lending to it`);
    if (info.type === "internal") return internal(name, grants ?? info.properties.scope, cb);
    return provide(
      "agent",
      {
        name,
        userID: info.properties.userID,
        role: info.properties.role,
        scope: grants ?? held,
        timezone: info.properties.timezone,
        credential: info.properties.credential,
      },
      cb,
    );
  }

  /** Someone answers for the act: a person, an agent for one, or an App. */
  export function known() {
    const info = use();
    return info.type === "user" || info.type === "agent" || info.type === "system";
  }

  /** Whoever answers for the act — `createdBy`, `:own` grants and per-user rows all key on it. */
  export function userID() {
    const info = use();
    if (info.type === "user" || info.type === "agent" || info.type === "system")
      return info.properties.userID;
    throw new Error(`Expected a known identity, got ${info.type}`);
  }

  /** The current identity as a queue can carry it, or null for public. */
  export function stamp(): Stamp | null {
    const info = use();
    if (info.type === "public") return null;
    if (info.type === "internal")
      return { type: "internal", name: info.properties.name, scope: info.properties.scope };
    if (info.type === "agent")
      return {
        type: "agent",
        userID: info.properties.userID,
        name: info.properties.name,
        scope: info.properties.scope,
        credential: info.properties.credential,
      };
    return {
      type: info.type,
      userID: info.properties.userID,
      credential: info.properties.credential,
    };
  }

  /**
   * The zone to count this identity's days in. UTC unless the caller that provided it knew
   * better — an App or the app's own code has no person to ask.
   */
  export function timezone() {
    const info = use();
    if (info.type === "user" || info.type === "agent") return info.properties.timezone ?? "UTC";
    return "UTC";
  }

  /**
   * Every listed action must be held. `owner` is the row's `createdBy` — when it matches
   * the identity, the role's `:own` grants count too. A scope narrows whatever holds one.
   */
  export function can(grants: Permission.Grants, owner?: string) {
    const info = use();
    if (info.type === "public") return false;
    if (info.type === "internal") return Permission.within(info.properties.scope, grants);
    const owned = owner === info.properties.userID;
    const held = Permission.can(info.properties.role, grants, owned);
    if (info.type === "system")
      return held && Permission.can(info.properties.owner.role, grants, owned);
    if (info.type === "agent" && info.properties.scope)
      return held && Permission.within(info.properties.scope, grants);
    return held;
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
