/// <reference path="../../.sst/platform/config.d.ts" />
import { readdirSync, readFileSync } from "fs"
import { isPermanentStage } from "./stage"

const DB_NAME = "testing"

const cluster = planetscale.getDatabasePostgresOutput({
  id: "agents",
  organization: "andrebrandao",
})


// const branch =
//   $app.stage === "prod"
//     ? planetscale.getPostgresBranchOutput({
//       id: cluster.defaultBranch,
//       organization: cluster.organization,
//       database: cluster.name,
//     })
//     : new planetscale.PostgresBranch("DatabaseBranch", {
//       database: cluster.name,
//       organization: cluster.organization,
//       name: $app.stage,
//       parentBranch: cluster.defaultBranch,
//     })


const branch = planetscale.getPostgresBranchOutput({
  id: cluster.defaultBranch,
  organization: cluster.organization,
  database: cluster.name,

})


const role = new planetscale.PostgresBranchRole("DatabaseRole", {
  database: cluster.name,
  organization: cluster.organization,
  branch: branch.name,
  name: `${$app.name}-${$app.stage}`,
  inheritedRoles: [
    "pg_read_all_data",
    "pg_write_all_data",
  ],
})


export const database = new sst.Linkable("Database", {
  properties: {
    host: role.accessHostUrl,
    database: cluster.name,
    username: role.username,
    password: role.password,
    port: 5432, // Use 5432 for direct connection instead of PgBouncer(6432)
    url: $interpolate`postgresql://${role.username}:${role.password}@${role.accessHostUrl}/${DB_NAME}?sslmode=require`,
  },
})


export const hyperdrive = new sst.cloudflare.Hyperdrive("Hyperdrive", {
  origin: {
    database: DB_NAME,
    host: role.accessHostUrl,
    password: role.password,
    scheme: "postgres",
    user: role.username,
    port: 6432, // PgBouncer — Hyperdrive needs pooled connections, not direct (5432 is for migrations only)
  },
})


// if (isPermanentStage) {
if (isPermanentStage) {

  const migrator_role = new planetscale.PostgresBranchRole("DatabaseMigratorRole", {
    database: cluster.name,
    organization: cluster.organization,
    branch: branch.name,
    name: `${$app.name}-migrator-${$app.stage}`,
    inheritedRoles: [
      "pg_read_all_data",
      "pg_write_all_data",
      "postgres", // Only needed for pushing schema changes
    ],
  })

  const dir = `${process.cwd()}/packages/core`

  const sql = readdirSync(`${dir}/migrations`, { recursive: true })
    .filter((f): f is string => typeof f === "string" && f.endsWith(".sql"))
    .map((f) => readFileSync(`${dir}/migrations/${f}`, "utf8"))
    .join("")

  new command.local.Command("DatabaseMigration", {
    dir,
    environment: {
      DATABASE_URL: $interpolate`postgresql://${migrator_role.username}:${migrator_role.password}@${migrator_role.accessHostUrl}/${DB_NAME}?sslmode=require`,
    },
    create: "bun run db:migrate",
    update: "bun run db:migrate",
    triggers: [sql],
  }, {
    dependsOn: [migrator_role],
  })

}
