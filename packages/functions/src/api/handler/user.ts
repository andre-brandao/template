import { z } from "zod";
import { Hono } from "hono";
import { authRequired, validator } from "../common";
import { describe } from "../doc";
import { User } from "@template/core/user";
import { Event } from "@template/core/event";
import { ErrorCodes, VisibleError } from "@template/core/error";
import { Identity } from "@template/core/identity";

export namespace UserApi {
  const doc = describe("User");
  const id = z.object({ id: User.Info.shape.id });

  export const route = new Hono()
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
    )
    .get(
      "/user/:id",
      doc(User.profile.meta, {
        200: doc.json(User.Profile),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      async (c) => c.json(await User.assert.exists(User.profile(c.req.valid("param").id)), 200),
    )
    .get(
      "/user/:id/history",
      doc(Event.by.meta, {
        200: doc.list(Event.Info),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("param", id),
      async (c) => c.json(await Event.by({ userID: c.req.valid("param").id }), 200),
    );
}
