import { type MiddlewareHandler } from "hono";
import { VisibleError, ErrorCodes } from "@template/core/error";
import { Identity } from "@template/core/identity";
import { Auth } from "@template/core/auth";
import { verifier } from "../auth/subject";
import { client } from "./auth";

const issuer = verifier(client);

/**
 * Every bearer kind — `sk-` key, `agt-` delegation, issuer JWT — goes through
 * `Auth.resolve`, which owns the formats. `audience` is which service is asking.
 */
export function auth(audience: "api" | "mcp" = "api"): MiddlewareHandler {
  return async (c, next) => {
    const header = c.req.header("authorization");
    if (!header) return Identity.provide("public", {}, next);

    const token = header.match(/^Bearer (.+)$/)?.[1];
    if (!token)
      throw new VisibleError(
        "authentication",
        ErrorCodes.Authentication.UNAUTHORIZED,
        "Bearer token not found or improperly formatted",
      );

    const info = await Auth.Issuer.provide(issuer, () => Auth.resolve(token, audience));
    return Identity.enter(info, next);
  };
}
