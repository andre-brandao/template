import { type MiddlewareHandler } from "hono";
import { VisibleError, ErrorCodes } from "@template/core/error";
import { Actor } from "@template/core/actor";
import { Key } from "@template/core/key";
import { subjects } from "../auth/subject";
import { client } from "./auth";

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
    return Actor.provide("user", { userID }, next);
  }

  const result = await client.verify(subjects, token);
  if (result.err)
    throw new VisibleError(
      "authentication",
      ErrorCodes.Authentication.INVALID_TOKEN,
      "Invalid or expired token",
    );

  return Actor.provide("user", { userID: result.subject.properties.userID }, next);
};
