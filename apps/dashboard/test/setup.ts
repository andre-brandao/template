import { mock } from "bun:test";

// hooks.server.ts pulls these SvelteKit virtual modules at load; they only exist inside a
// Vite build, so shim them for bun test. dev=false exercises the production error branches.
mock.module("$app/environment", () => ({ dev: false, building: false, browser: false }));
mock.module("$env/dynamic/private", () => ({ env: {} }));
