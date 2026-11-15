import { Event } from "@template/core/event";
import { Identity } from "@template/core/identity";
import { User } from "@template/core/user";
import { remote } from "$lib/server/remote";

/**
 * One account as the reader may see it, plus what the reader may do with it: edit it as
 * themselves, or manage it as an admin when it is a bot.
 */
export const getProfile = remote.query(User.Info.shape.id, async (id) => {
  const profile = await User.profile(id);
  if (!profile) return null;
  return {
    ...profile,
    self: Identity.userID() === id,
    manage: profile.kind === "bot" && Identity.can({ app: ["update"] }),
  };
});

/** What the account did. Core narrows it to public types for anyone but an admin. */
export const getHistory = remote.query(User.Info.shape.id, (id) => Event.by({ userID: id }));
