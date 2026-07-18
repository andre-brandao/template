import { readdirSync, readFileSync } from "fs"
import { isPermanentStage } from "./stage"
import { vpc } from "./vpc"


export const database = new sst.aws.Postgres("Database", {
  vpc,
})

export const url = $interpolate`postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}?sslmode=require`

// export const migrator = new sst.aws.Function("DatabaseMigrator", {
//   vpc,
//   link: [database],
//   handler: "./apps/functions/src/migrator.handler",
//   copyFiles: [
//     {
//       from: "./packages/core/migrations",
//       to: "./migrations",
//     },
//   ],
//   environment: {
//     TZ: "America/Sao_Paulo",
//     DATABASE_URL: $interpolate`postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}?sslmode=require`,
//   },
// });

// if (!$dev) {
//   new aws.lambda.Invocation("DatabaseMigratorInvocation", {
//     input: Date.now().toString(),
//     functionName: migrator.name,
//   });
// }

new sst.x.DevCommand("Studio", {
  link: [database],
  environment: {
    DATABASE_URL: url,
  },
  dev: {
    command: "bunx drizzle-kit studio",
    directory: "./packages/core",
  },
});


export const outputs = {
  database: database.host,
};
