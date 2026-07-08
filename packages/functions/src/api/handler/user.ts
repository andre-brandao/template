import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { Result, ErrorResponses, authRequired } from "../common";
import { User } from "@template/core/user";
import { Examples } from "@template/core/examples";
import { ErrorCodes, VisibleError } from "@template/core/error";
import { Actor } from "@template/core/actor";

export namespace UserApi {
  export const route = new Hono().get(
    "/me",
    describeRoute({
      tags: ["User"],
      summary: "Get current user",
      description: "Get the profile of the currently authenticated user.",
      responses: {
        200: {
          content: {
            "application/json": { schema: Result(User.Info), example: Examples.User },
          },
          description: "The current user.",
        },
        401: ErrorResponses[401],
        500: ErrorResponses[500],
      },
    }),
    authRequired,
    async (c) => {
      const user = await User.fromID(Actor.userID());
      if (!user)
        throw new VisibleError("not_found", ErrorCodes.NotFound.RESOURCE_NOT_FOUND, "User not found");
      return c.json(user, 200);
    },
  );
}
