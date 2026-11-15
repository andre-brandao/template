import { mock } from "bun:test";

// The hooks modules pull these SvelteKit virtual modules at load; they only exist inside a
// Vite build, so shim them for bun test. dev=false exercises the production error branches.
mock.module("$app/env", () => ({ dev: false, building: false, browser: false }));
mock.module("$app/env/private", () => ({}));
mock.module("$app/navigation", () => {
  const noop = async () => {};
  return {
    goto: noop,
    invalidate: noop,
    refreshAll: noop,
    afterNavigate: () => {},
  };
});
