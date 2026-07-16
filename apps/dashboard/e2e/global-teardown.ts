import { readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pid = fileURLToPath(new URL("./.pglite.pid", import.meta.url));

export default function () {
  const id = Number(readFileSync(pid, "utf8"));
  // SIGINT so scripts/pglite.ts closes the db and socket gracefully.
  if (id) process.kill(id, "SIGINT");
  rmSync(pid, { force: true });
}
