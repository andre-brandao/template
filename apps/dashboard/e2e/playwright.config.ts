import { spawnSync } from "node:child_process";
import { defineConfig, devices } from "@playwright/test";

const ci = !!process.env.CI;
const port = 4173;
const base = `http://127.0.0.1:${port}`;

// e2e runs against a real Postgres on a dedicated database; util/setup.ts creates
// and migrates it. Point local runs at your dev Postgres via E2E_PG (default
// matches the repo's docker compose); CI provides one as a service.
const pg = process.env.E2E_PG ?? "postgresql://postgres:password@127.0.0.1:5432";
const url = `${pg}/${process.env.E2E_DB ?? "template_e2e"}`;
process.env.DATABASE_URL = url;

// Playwright's bundled chromium won't launch on NixOS; use the system one locally.
// CI keeps the pinned browser; CHROME_PATH overrides.
function browser() {
  if (ci) return undefined;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const found = spawnSync("which", ["chromium"], { encoding: "utf8" });
  return found.status === 0 ? found.stdout.trim() : undefined;
}

const chrome = browser();

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.e2e.ts",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 2 : 0,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    // `github` emits inline PR annotations for failures; only meaningful in CI. Line locally.
    ci ? ["github"] : ["line"],
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalSetup: "./util/setup.ts",
  use: {
    baseURL: base,
    // Pinned: the settings suite picks UTC from a zone list Chromium's Intl only
    // offers when the browser is standing in it. CI runners are UTC, dev machines aren't.
    timezoneId: "UTC",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "bun run build && bun run preview --port 4173 --strictPort --host 127.0.0.1",
    // Liveness, not readiness: Playwright boots the server before globalSetup, so on a
    // fresh machine the database it needs doesn't exist yet. globalSetup creates and
    // migrates it before any test runs.
    url: `${base}/healthz`,
    reuseExistingServer: !ci,
    // Covers a cold build (~40s on CI) plus boot.
    timeout: 120_000,
    env: { SVELTE_ADAPTER: "node", DATABASE_URL: url },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chrome ? { launchOptions: { executablePath: chrome } } : {}),
      },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
