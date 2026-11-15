import { z } from "zod";
import { Context } from "./context";
import { Log } from "./util/log";
import { Permission } from "./permission";
import { ErrorCodes, VisibleError } from "./error";

/**
 * Who is acting. Every way in — cookie, key, issuer JWT, delegation, job replay — ends in one
 * of these; `Auth` owns turning a credential into it. `userID` is whoever answers for the act:
 * the person, the bot's own row, or the person an agent acts for.
 */
export namespace Identity {
  const id = z.string().meta({ description: "Who answers for the act." });
  const role = z.enum(Permission.roles).meta({ description: "The role held at the time." });
  const zone = z.string().optional().meta({ description: "IANA zone, when known." });
  const scope = z
    .custom<Permission.Grants>((v) => typeof v === "object" && v !== null)
    .optional()
    .meta({ description: "What the agent was narrowed to. Absent means the user's full role." });

  /** A zod union, not just types, so an identity can be stored with what it did and read back. */
  export const Info = z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("public"), properties: z.object({}) }),
      // Trusted internal caller — queue jobs with no pusher, seeds, migrations. Skips every check.
      z.object({ type: z.literal("system"), properties: z.object({}) }),
      z.object({
        type: z.literal("user"),
        properties: z.object({ userID: id, role, timezone: zone }),
      }),
      // A non-human account: an external system, CI, an integration. A user row of `kind: "bot"`.
      z.object({ type: z.literal("bot"), properties: z.object({ userID: id, role }) }),
      // Software acting for a person: their role, narrowed to `scope` when one is set.
      z.object({
        type: z.literal("agent"),
        properties: z.object({
          name: z
            .string()
            .meta({ description: "Which agent: `copilot`, or an MCP client like `claude`." }),
          userID: id,
          role,
          scope,
          timezone: zone,
        }),
      }),
    ])
    .meta({
      ref: "Identity",
      description: "Who acted: a person, a bot, an agent for a person, or the system.",
    });
  export type Info = z.infer<typeof Info>;
  export type Type = Info["type"];

  /**
   * What survives a queue hop. The role is left out on purpose: replay re-reads it off the row,
   * so a job can't outlive a demotion.
   */
  export const Stamp = z.object({
    type: z.enum(["user", "bot", "agent"]),
    userID: z.string(),
    name: z.string().optional(),
    scope,
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

  export function assert<T extends Type>(type: T) {
    const info = use();
    if (info.type !== type) throw new Error(`Expected identity type ${type}, got ${info.type}`);
    return info as Extract<Info, { type: T }>;
  }

  /** Signed in as anyone: a person, a bot, or an agent for a person. */
  export function known() {
    const info = use();
    return info.type === "user" || info.type === "bot" || info.type === "agent";
  }

  /** Whoever answers for the act — `createdBy`, `:own` grants and per-user rows all key on it. */
  export function userID() {
    const info = use();
    if (info.type === "user" || info.type === "bot" || info.type === "agent")
      return info.properties.userID;
    throw new Error(`Expected a known identity, got ${info.type}`);
  }

  /** The current identity as a queue can carry it, or null for public/system. */
  export function stamp(): Stamp | null {
    const info = use();
    if (info.type === "user" || info.type === "bot")
      return { type: info.type, userID: info.properties.userID };
    if (info.type === "agent")
      return {
        type: "agent",
        userID: info.properties.userID,
        name: info.properties.name,
        scope: info.properties.scope,
      };
    return null;
  }

  /**
   * The zone to count this identity's days in. UTC unless the caller that provided it knew
   * better — a job, bot or system caller has no person to ask.
   */
  export function timezone() {
    const info = use();
    if (info.type === "user" || info.type === "agent") return info.properties.timezone ?? "UTC";
    return "UTC";
  }

  /**
   * Every listed action must be held. `owner` is the row's `createdBy` — when it matches
   * the identity, the role's `:own` grants count too. An agent also needs them in its scope.
   */
  export function can(grants: Permission.Grants, owner?: string) {
    const info = use();
    if (info.type === "system") return true;
    if (info.type === "public") return false;
    const held = Permission.can(info.properties.role, grants, owner === info.properties.userID);
    if (info.type !== "agent" || !info.properties.scope) return held;
    return held && Permission.within(info.properties.scope, grants);
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
