#!/usr/bin/env bun
// Drives the running dev stack's dashboard as an authenticated user (stack must be running).
//   bun .claude/skills/run-template/driver.ts shot <route> [out.png] | todo <title> [out.png]
// Env: BASE, DATABASE_URL, EMAIL, CHROME_PATH — see SKILL.md.

import { spawnSync } from "node:child_process";
import { Database } from "../../../packages/core/src/drizzle/index";
import { Identity } from "../../../packages/core/src/identity";
import { Permission } from "../../../packages/core/src/permission";
import { User } from "../../../packages/core/src/user/index";
import { Session } from "../../../packages/core/src/auth/session";
import { chromium } from "../../../apps/dashboard/node_modules/@playwright/test/index.js";

// Signup publishes an event; a db queue needs the app's runner, so the driver's own stays in memory.
process.env.QUEUE_DRIVER ??= "memory";
const base = process.env.BASE ?? "http://127.0.0.1:4174";
const pg = process.env.DATABASE_URL ?? "postgresql://postgres:password@127.0.0.1:5432/postgres";
const role = (process.env.ROLE ?? "admin") as Permission.Role;

// Real user in the app's db, session opened like /callback — no login UI (see e2e/util/mint.ts).
// Released straight after so the driver holds no idle pool while the browser runs.
const db = Database.connect(pg);
const cookie = await Database.provide(db, () =>
  Identity.internal("driver", Permission.all, async () => {
    const email = `driver-${crypto.randomUUID()}@example.com`;
    const id = (await User.create({ name: "Driver", email })).id;
    if (role !== "member") await User.assign({ id, role });
    return Session.create(id);
  }),
).finally(() => Database.release(db));

// Playwright's bundled chromium won't launch on NixOS; use the system one.
const chrome =
  process.env.CHROME_PATH ?? spawnSync("which", ["chromium"], { encoding: "utf8" }).stdout.trim();

const browser = await chromium.launch({ headless: true, executablePath: chrome || undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([{ name: "auth", value: cookie, url: base }]);
const page = await context.newPage();

const errors: string[] = [];
page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
page.on("pageerror", (err) => errors.push(String(err)));

const [cmd, arg, out] = process.argv.slice(2);

async function shot(path: string) {
  await page.screenshot({ path, fullPage: true });
  console.log(`screenshot: ${path}`);
}

if (cmd === "shot") {
  await page.goto(`${base}${arg ?? "/"}`, { waitUntil: "networkidle" });
  console.log(`title: ${await page.title()}`);
  await shot(out ?? "shot.png");
}

if (cmd === "todo") {
  const title = arg ?? `Driver todo ${Date.now()}`;
  await page.goto(`${base}/todos`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New todo" }).click();
  await page.getByPlaceholder("What needs doing?").fill(title);
  await page.getByRole("button", { name: "Add todo" }).click();
  await page.getByRole("link", { name: title }).waitFor({ state: "visible" });
  console.log(`created and visible: ${title}`);
  await shot(out ?? "todo.png");
}

if (!cmd || !["shot", "todo"].includes(cmd)) {
  console.log("usage: bun driver.ts shot <route> [out.png] | todo <title> [out.png]");
}

if (errors.length) console.log(`console errors:\n${errors.join("\n")}`);
await browser.close();
process.exit(0);
