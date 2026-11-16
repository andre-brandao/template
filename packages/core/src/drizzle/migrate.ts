import { migrate } from "drizzle-orm/pg-core";
import CENTRAL from "../../migrations/central";
import TENANT from "../../migrations/tenant";
import { Workspace } from "../workspace";
import { Central } from "./central";
import { Database, sql } from "./index";

// The sets are bundled into modules by `bundle.ts`, so nothing here reads the disk: a worker runs it too.
export namespace Migrations {
  /**
   * Central first (journal in `drizzle.__drizzle_migrations`), then the tenant set into the
   * single-mode schema (`public` by default) and every registered workspace.
   */
  export async function apply(url = process.env.DATABASE_URL ?? Database.DEFAULT_URL) {
    const client = Database.connect(url, { max: 1 });
    await Database.provide(client, async () => {
      await Central.transaction((tx) => migrate(CENTRAL, tx, { migrationsFolder: "" }));
      // Raw, so the kernel never imports the platform registry's table.
      const rows = await Central.use((tx) =>
        tx.execute<{ schema: string }>(sql`select schema from central.workspace`, "objects"),
      );
      const schemas = new Set([Workspace.single().schema, ...rows.map((row) => row.schema)]);
      for (const schema of schemas) await tenant(schema);
    });
    await Database.release(client);
  }

  /**
   * Replays the tenant set into `schema` on the current client, its journal included. The
   * migrator creates the schema first, and the transaction's search_path points tables at it.
   */
  export function tenant(schema: string) {
    const name = Workspace.valid(schema);
    return Workspace.provide({ schema: name }, () =>
      Database.transaction((tx) =>
        migrate(TENANT, tx, { migrationsFolder: "", migrationsSchema: name }),
      ),
    );
  }
}

if (import.meta.main) {
  await Migrations.apply();
}
