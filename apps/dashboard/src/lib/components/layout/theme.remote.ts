import { getRequestEvent } from "$app/server";
import { User } from "@template/core/user";
import { Prefs } from "@template/core/user/prefs";
import { remote } from "$lib/server/remote";
import * as theme from "$lib/server/theme";

/**
 * The chrome's own one-field write, so the account menu doesn't reach into the settings
 * slice for it. The Experience page patches the same field through `prefs.remote`.
 */
export const save = remote.command(Prefs.shape.theme, async (input) => {
  await User.prefs({ theme: input });
  // Keep the cookie in step so the next hard load paints the right theme immediately.
  theme.write(getRequestEvent(), input);
});
