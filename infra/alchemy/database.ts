import * as Cloudflare from "alchemy/Cloudflare";
import * as Output from "alchemy/Output";
import * as Planetscale from "alchemy/Planetscale";
import * as Command from "alchemy/Command";
import { Stack } from "alchemy/Stack";
import path from "node:path";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import { permanent } from "./stage";

const DB = "testing-alc";

// The cluster is shared with the SST and terraform stacks: looked up by name, never created.
const cluster = "agents";
// The seam for a branch per stage: swap in a `PostgresBranch` (or its `.ref`) here.
const branch = "main";

const Role = Planetscale.PostgresRole("DatabaseRole", {
  database: cluster,
  branch,
  inheritedRoles: ["pg_read_all_data", "pg_write_all_data"],
});

// Paths resolve from the repo root, not the deployer's cwd.
const root = path.join(import.meta.dirname, "../..");

export const Hyperdrive = Effect.gen(function* () {
  const role = yield* Role;
  return yield* Cloudflare.Hyperdrive.Connection("Hyperdrive", {
    // PgBouncer, matching infra/sst/cf; alchemy's docs default to the direct `origin`.
    origin: Output.map(role.pooledOrigin, (o) => ({ ...o, database: DB })),
  });
});

export const migrate = Effect.gen(function* () {
  const stack = yield* Stack;
  if (!permanent(stack.stage)) return;

  const role = yield* Planetscale.PostgresRole("DatabaseMigratorRole", {
    database: cluster,
    branch,
    inheritedRoles: ["pg_read_all_data", "pg_write_all_data", "postgres"],
  });

  // Runs as `postgres`: PG15+ only lets the owner create in `public`, and tables then
  // outlive this role instead of being owned by it.
  yield* Command.Exec("DatabaseMigration", {
    // drizzle-kit reports failures on stdout, but alchemy's CommandError only carries stderr.
    command: "bun run db:migrate 1>&2",
    shell: true,
    cwd: path.join(root, "packages/core"),
    env: {
      DATABASE_URL: Output.map(
        Output.all(role.username, role.password, role.host),
        ([user, pass, host]) =>
          Redacted.make(
            `postgresql://${user}:${Redacted.value(pass)}@${host}/${DB}?sslmode=require&options=${encodeURIComponent("-c role=postgres")}`,
          ),
      ),
    },
    memo: { include: ["migrations/**/*.sql"] },
  });
});
