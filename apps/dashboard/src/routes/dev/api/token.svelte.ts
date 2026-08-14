import { createContext } from "svelte";

/**
 * The key the console signs requests with. Lives in the section layout so switching
 * operations doesn't reset it — and so the picker sits next to the operation list.
 */
const [token, set] = createContext<{ current: string }>();

export { token };

/** Call once, in the section layout. */
export function createToken() {
  const state = $state({ current: "" });
  set(state);
  return state;
}
