import { Hono } from "hono";
import { authRequired } from "../common";
import { describe } from "../doc";
import { User } from "@template/core/user";
import { ErrorCodes, VisibleError } from "@template/core/error";
import { Actor } from "@template/core/actor";

export namespace UserApi {
  const doc = describe("User");

  export const route = new Hono().get(
    "/me",
    // Literal: the route reads the actor rather than taking an id, so `User.fromID`'s docs
    // would name the wrong operation.
    doc(
      {
        title: "Get current user",
        description: "Get the profile of the currently authenticated user.",
      },
      { 200: doc.json(User.Info) },
    ),
    authRequired,
    async (c) => {
      const user = await User.fromID(Actor.userID());
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
