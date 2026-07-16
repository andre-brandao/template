import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const pid = fileURLToPath(new URL("./.pglite.pid", import.meta.url));

// Boot the shared pglite socket server (scripts/pglite.ts runs migrations, then
// logs "Server started") and leave it running for the whole suite. Its pid is
// stashed for global-teardown. Both the app and fixtures.ts connect to it.
export default function () {
  const child = spawn("bun", ["run", "scripts/pglite.ts"], {
    cwd: root,
    env: { ...process.env, PGPORT: process.env.PGPORT, DATABASE_URL: process.env.DATABASE_URL },
    stdio: ["ignore", "pipe", "inherit"],
  });
  writeFileSync(pid, String(child.pid));

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("pglite did not start in 60s")), 60_000);
    child.stdout.on("data", (chunk) => {
      if (!String(chunk).includes("Server started")) return;
      clearTimeout(timer);
      child.stdout.removeAllListeners("data");
      resolve();
    });
    child.on("exit", (code) => reject(new Error(`pglite exited early (code ${code})`)));
  });
}
