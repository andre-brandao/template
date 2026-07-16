import { defineConfig, devices } from "@playwright/test";

const ci = !!process.env.CI;
const port = 4173;
const base = `http://127.0.0.1:${port}`;

// e2e runs against a real Postgres on a dedicated database; global-setup creates
// and migrates it. Point local runs at your dev Postgres via E2E_PG (default
// matches the repo's docker compose); CI provides one as a service.
const pg = process.env.E2E_PG ?? "postgresql://postgres:password@127.0.0.1:5432";
const url = `${pg}/${process.env.E2E_DB ?? "template_e2e"}`;
process.env.DATABASE_URL = url;

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
    env: { SVELTE_ADAPTER: "node", DATABASE_URL: url },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
