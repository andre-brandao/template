import { getRequestEvent } from "$app/server";
import { User } from "@template/core/user";
import { remote } from "#lib/server/gate.ts";
import * as theme from "#lib/server/theme.ts";

// Autosaves one or more preferences. No matching query: they ride the root load, which
// `prefs.query`'s `update` invalidates once this resolves.
export const save = remote.command(User.prefs.schema, async (input) => {
  await User.prefs(input);
  // Keep the cookie in step so the next hard load paints the right theme immediately.
  if (input.theme) theme.write(getRequestEvent(), input.theme);
});
