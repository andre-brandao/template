import { type MiddlewareHandler } from "hono";
import { VisibleError, ErrorCodes } from "@template/core/error";
import { Actor } from "@template/core/actor";
import { Auth } from "@template/core/user/auth";

export const auth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("authorization");

  if (authHeader) {
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match || !match[1]) {
      throw new VisibleError(
        "authentication",
        ErrorCodes.Authentication.UNAUTHORIZED,
        "Bearer token not found or improperly formatted",
      );
    }

    const userID = await Auth.verify(match[1]);
    if (!userID)
      throw new VisibleError(
        "authentication",
        ErrorCodes.Authentication.INVALID_TOKEN,
        "Invalid or expired token",
      );

    return Actor.provide("user", { userID }, next);
  }

  return Actor.provide("public", {}, next);
};
