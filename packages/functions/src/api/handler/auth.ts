import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { Result, validator, ErrorResponses, authRequired } from "../common";
import { Auth } from "@template/core/user/auth";

const Session = z.object({
  userID: z.string().meta({ description: "The logged-in user's ID." }),
  token: z.string().meta({ description: "Bearer session token. Include as `Authorization: Bearer <token>`." }),
});

export namespace AuthApi {
  export const route = new Hono()
    .post(
      "/register",
      describeRoute({
        tags: ["Auth"],
        summary: "Register",
        description: "Create a new user with an email/password and start a session.",
        responses: {
          200: { content: { "application/json": { schema: Result(Session) } }, description: "New session." },
          400: ErrorResponses[400],
          500: ErrorResponses[500],
        },
      }),
      validator("json", Auth.register.schema),
      async (c) => {
        const session = await Auth.register(c.req.valid("json"));
        return c.json(session, 200);
      },
    )
    .post(
      "/login",
      describeRoute({
        tags: ["Auth"],
        summary: "Login",
        description: "Exchange an email/password for a new session.",
        responses: {
          200: { content: { "application/json": { schema: Result(Session) } }, description: "New session." },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      validator("json", Auth.login.schema),
      async (c) => {
        const session = await Auth.login(c.req.valid("json"));
        return c.json(session, 200);
      },
    )
    .post(
      "/logout",
      describeRoute({
        tags: ["Auth"],
        summary: "Logout",
        description: "Invalidate the current session.",
        responses: {
          200: { content: { "application/json": { schema: Result(z.literal("ok")) } }, description: "Logged out." },
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      async (c) => {
        const token = c.req.header("authorization")!.replace(/^Bearer /, "");
        await Auth.logout(token);
        return c.json("ok" as const, 200);
      },
    );
}
