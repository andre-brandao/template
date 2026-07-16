import { defineConfig, devices } from "@playwright/test";

const ci = !!process.env.CI;
const port = 4173;
const base = `http://127.0.0.1:${port}`;

// The app under test and the mint helper (fixtures.ts) share one pglite over a
// socket — global-setup starts it on this port and exports DATABASE_URL to both.
const pgport = "5433";
const url = `postgresql://postgres:password@127.0.0.1:${pgport}/postgres`;
process.env.DATABASE_URL = url;
process.env.PGPORT = pgport;

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.e2e.ts",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 2 : 0,
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["line"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  use: {
    baseURL: base,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "bun run build && bun run preview --port 4173 --strictPort --host 127.0.0.1",
    url: `${base}/healthz`,
    reuseExistingServer: !ci,
    timeout: 120_000,
    env: { SVELTE_ADAPTER: "node", DATABASE_URL: url, PGPORT: pgport },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
