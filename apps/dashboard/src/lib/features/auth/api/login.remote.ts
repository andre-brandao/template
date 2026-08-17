import { getRequestEvent } from "$app/server";
import { redirect } from "@sveltejs/kit";
import { z } from "zod";
import { Auth } from "@template/core/user/auth";
import { remote } from "$lib/server/remote";
import * as session from "$lib/server/session";

// Core resolves a login to a `userID` and stops there, so the cookie is minted here — the
// same call `/callback` makes after the issuer. Nothing below needs the issuer running.
async function enter(user: string) {
  await session.write(getRequestEvent(), user);
  redirect(303, "/");
}

/**
 * One door. The password field only mounts once the visitor asks for it, so an absent
 * password is the ordinary case and means "mail me a code" — which is also the signup path,
 * since `Code.verify` provisions an account it doesn't find.
 */
export const start = remote.public.form(
  // `_password`, not `password`: a leading underscore is what keeps SvelteKit from echoing the
  // value back into the HTML when a no-JS submit fails validation.
  z.object({ email: z.email(), _password: z.string().min(1).optional() }),
  async (input) => {
    if (input._password === undefined) {
      await Auth.Code.request({ email: input.email });
      return { sent: input.email };
    }
    return enter(await Auth.Pass.login({ email: input.email, password: input._password }));
  },
);

export const verify = remote.public.form(Auth.Code.verify.schema, async (input) =>
  enter(await Auth.Code.verify(input)),
);
