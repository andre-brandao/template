import { error } from "@sveltejs/kit";
import { Identity } from "@template/core/identity";

export const MAX = 20 * 1024 * 1024;

/**
 * There is no metadata table, so a key's prefix *is* its owner. `name` comes off a
 * filename, so it's flattened to a basename — otherwise `../` walks into someone else.
 */
export function key(name: string) {
  const base = name.split(/[\\/]/).at(-1)?.trim();
  if (!base || base === "." || base === "..") error(400, `Invalid filename: ${name}`);
  return `${Identity.userID()}/${base}`;
}
