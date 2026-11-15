import { Hono } from "hono";
import { authRequired, validator } from "../common";
import { describe } from "../doc";
import { User } from "@template/core/user";
import { ErrorCodes, VisibleError } from "@template/core/error";
import { Identity } from "@template/core/identity";

export namespace UserApi {
  const doc = describe("User");

  export const route = new Hono()
    .get(
      "/user",
      doc(User.list.meta, {
        200: doc.list(User.Summary),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", User.list.schema),
      async (c) => c.json(await User.list(c.req.valid("query")), 200),
    )
    .get(
      "/me",
      // Literal: the route reads the actor rather than taking an id, so `User.fromID`'s docs
      // would name the wrong operation.
      doc(
        {
          title: "Get current user",
          description: "Get the profile of the currently authenticated user.",
        },
        {
          200: doc.json(User.Info),
          ...doc.errors(401, 500),
        },
      ),
      authRequired,
      async (c) => {
        const user = await User.fromID(Identity.userID());
        if (!user)
          throw new VisibleError(
            "not_found",
            ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
            "User not found",
          );
        return c.json(user, 200);
      },
    );
}
