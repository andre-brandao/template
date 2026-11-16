import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { formatToMillis } from "drizzle-orm/migrator.utils";

/**
 * Turns each drizzle-kit folder into an `index.ts` of `MigrationMeta`, so `Migrations` runs
 * without node:fs. Mirrors drizzle's `readMigrationFiles` (sha256 of the file) so journals match.
 */
function bundle(dir: string) {
  const list = readdirSync(dir)
    .filter((name) => existsSync(join(dir, name, "migration.sql")))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const query = readFileSync(join(dir, name, "migration.sql")).toString();
      return {
        sql: query.split("--> statement-breakpoint"),
        bps: true,
        folderMillis: formatToMillis(name.slice(0, 14)),
        hash: createHash("sha256").update(query).digest("hex"),
        name,
      };
    });
  writeFileSync(
    join(dir, "index.ts"),
    [
      "// Written by `src/drizzle/bundle.ts` on `db:generate`; never edit by hand.",
      'import type { MigrationMeta } from "drizzle-orm/migrator";',
      "",
      `const migrations: MigrationMeta[] = ${JSON.stringify(list, null, 2)};`,
      "export default migrations;",
      "",
    ].join("\n"),
  );
  return list.length;
}

// The root is an argument only so a scratch folder can be bundled.
const root = process.argv[2] ?? join(import.meta.dirname, "../../migrations");
for (const set of ["central", "tenant"]) console.log(set, bundle(join(root, set)));
