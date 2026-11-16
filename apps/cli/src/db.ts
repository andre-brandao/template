import { Database } from "@template/core/drizzle";
import { Migrations } from "@template/core/drizzle/migrate";
import { value } from "./args";

const subcommands: Record<string, (rest: string[]) => Promise<void>> = {
  /** Applies central then every tenant schema to `--url` › `DATABASE_URL`, or one with `--workspace`. */
  async migrate(rest) {
    const schema = value(rest, "--workspace");
    const url = value(rest, "--url") ?? process.env.DATABASE_URL ?? Database.DEFAULT_URL;
    await (schema ? tenant(url, schema) : Migrations.apply(url));
    console.log("migrations applied");
  },
};

export async function db(rest: string[]) {
  const run = subcommands[rest[0] ?? ""];
  if (!run) {
    console.error(
      `Usage: template-cli db <${Object.keys(subcommands).join("|")}> [--url <database>] [--workspace <schema>]`,
    );
    process.exit(1);
  }
  await run(rest.slice(1));
}

async function tenant(url: string, schema: string) {
  const client = Database.connect(url, { max: 1 });
  await Database.provide(client, () => Migrations.tenant(schema));
  await Database.release(client);
}
