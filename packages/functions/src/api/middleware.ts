import { type MiddlewareHandler, type Next } from "hono";
import { VisibleError, ErrorCodes } from "@template/core/error";
import { Actor } from "@template/core/actor";
import { Key } from "@template/core/key";
import { User } from "@template/core/user";
import { zone } from "@template/core/user/prefs";
import { subjects } from "../auth/subject";
import { client } from "./auth";

// Both token kinds resolve to a bare user id. The role always comes from the row, so an
// API key can never outlive the permissions of the user who minted it.
async function actor(userID: string, next: Next) {
  const row = await User.fromID(userID);
  if (!row)
    throw new VisibleError(
      "authentication",
      ErrorCodes.Authentication.INVALID_TOKEN,
      "Token belongs to a user that no longer exists",
    );
  return Actor.provide("user", { userID, role: row.role, timezone: zone(row.prefs) }, next);
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
    const userID = await Key.verify(token);
    if (!userID)
      throw new VisibleError(
        "authentication",
        ErrorCodes.Authentication.INVALID_TOKEN,
        "Invalid or expired API key",
      );
    return actor(userID, next);
  }

  const result = await client.verify(subjects, token);
  if (result.err)
    throw new VisibleError(
      "authentication",
      ErrorCodes.Authentication.INVALID_TOKEN,
      "Invalid or expired token",
    );

  return actor(result.subject.properties.userID, next);
};
