import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { Database } from "./index";

// Kept out of `Database` so worker bundles never pull in the migrator's node:fs reads.
export namespace Migrations {
  const DIR = fileURLToPath(new URL("../../migrations", import.meta.url));

  /**
   * Applies pending migrations over a dedicated connection, never the app pool. The
   * journal stays in `drizzle.__drizzle_migrations`, the table `drizzle-kit migrate` writes.
   */
  export async function apply(url = process.env.DATABASE_URL ?? Database.DEFAULT_URL, dir = DIR) {
    const client = Database.connect(url, { max: 1 });
    await migrate(client.db, { migrationsFolder: dir });
    await Database.release(client);
  }
}

if (import.meta.main) {
  await Migrations.apply();
}
