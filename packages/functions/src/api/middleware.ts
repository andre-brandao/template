import { type MiddlewareHandler } from "hono";
import { VisibleError, ErrorCodes } from "@template/core/error";
import { Actor } from "@template/core/actor";
import { Key } from "@template/core/key";
import { Member } from "@template/core/organization/member";
import { subjects } from "../auth/subject";
import { client } from "./auth";

/**
 * `X-Org-ID` names the org a JWT caller acts in — it must be one of their
 * memberships. Without it the actor is user-scoped only: org-scoped routes
 * reject up front (`orgRequired`) instead of the API guessing an org on the
 * caller's behalf, and user-scoped routes skip the membership lookup entirely.
 */
async function props(userID: string, org?: string) {
  if (!org) return { userID };
  const membership = await Member.resolve({ userID, orgID: org });
  if (membership?.orgID !== org)
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.FORBIDDEN,
      "Not a member of that organization",
    );
  return { userID, orgID: membership.orgID, permissions: membership.permissions };
}

export const auth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header("authorization");
  if (!header) return Actor.provide("public", {}, next);

  const match = header.match(/^Bearer (.+)$/);
  if (!match || !match[1])
    throw new VisibleError(
      "authentication",
      ErrorCodes.Authentication.UNAUTHORIZED,
      "Bearer token not found or improperly formatted",
    );
  const token = match[1];

  // `sk-` secrets are user-minted API keys, resolved in Postgres. Anything else
  // is a JWT from the OpenAuth issuer, verified statelessly against its JWKS.
  if (token.startsWith("sk-")) {
    const key = await Key.verify(token);
    if (!key)
      throw new VisibleError(
        "authentication",
        ErrorCodes.Authentication.INVALID_TOKEN,
        "Invalid or expired API key",
      );
    // A key is bound to its role's org — it can't be pointed elsewhere.
    const org = c.req.header("x-org-id");
    if (org && org !== key.orgID)
      throw new VisibleError(
        "forbidden",
        ErrorCodes.Permission.FORBIDDEN,
        "The key is bound to another organization",
      );
    return Actor.provide("user", key, next);
  }

  const result = await client.verify(subjects, token);
  if (result.err)
    throw new VisibleError(
      "authentication",
      ErrorCodes.Authentication.INVALID_TOKEN,
      "Invalid or expired token",
    );

  return Actor.provide(
    "user",
    await props(result.subject.properties.userID, c.req.header("x-org-id")),
    next,
  );
};
