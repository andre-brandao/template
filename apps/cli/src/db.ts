import { Migrations } from "@template/core/drizzle/migrate";
import { value } from "./args";

const subcommands: Record<string, (rest: string[]) => Promise<void>> = {
  /** Applies pending core migrations to `--url` › `DATABASE_URL`. Reads them from source, so not in `--compile` builds. */
  async migrate(rest) {
    await Migrations.apply(value(rest, "--url"));
    console.log("migrations applied");
  },
};

export async function db(rest: string[]) {
  const run = subcommands[rest[0] ?? ""];
  if (!run) {
    console.error(
      `Usage: template-cli db <${Object.keys(subcommands).join("|")}> [--url <database>]`,
    );
    process.exit(1);
  }
  await run(rest.slice(1));
}
