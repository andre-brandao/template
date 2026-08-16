import { afterEach, beforeEach } from "bun:test";
import { act, cleanup, setup } from "@testing-library/svelte/pure";

// testing-library self-registers these, but bun binds a hook to whichever file first
// imported the module, so every later file ran without cleanup. Preload applies to all.
// Loads after svelte-loader.ts, which must register happy-dom and the svelte redirect first.
beforeEach(async () => {
  await setup();
});

afterEach(async () => {
  await act();
  cleanup();
});
