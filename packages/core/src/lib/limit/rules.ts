import { FixedWindow } from "./algo";
import { catalog } from "./catalog";

/** The only application policy catalog. Add rules here so limits stay discoverable and typed. */
export const Limits = catalog({
  auth: {
    password: {
      algorithm: FixedWindow,
      options: { limit: 10, window: 15 * 60 },
    },
  },
});
