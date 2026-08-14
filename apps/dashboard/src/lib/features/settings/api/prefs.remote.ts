import { getRequestEvent } from "$app/server";
import { User } from "@template/core/user";
import { remote } from "$lib/server/remote";
import * as theme from "$lib/server/theme";

/**
 * Autosaves one or more preferences. There is no matching query: the root layout already
 * loads the user, so the page reads `data.user.prefs` and calls `invalidateAll()` after
 * this resolves — a `command` doesn't invalidate loads on its own.
 */
export const save = remote.command(User.prefs.schema, async (input) => {
  await User.prefs(input);
  // Keep the cookie in step so the next hard load paints the right theme immediately.
  if (input.theme) theme.write(getRequestEvent(), input.theme);
});
