# modules/database/main.tf
#
# Ports infra/sst/cf/database.ts: a PlanetScale Postgres role, the Hyperdrive
# config the workers connect through, and — on permanent environments only —
# a migrator role and the drizzle migration run.
#
# The cluster itself is looked up, never created. It predates both deploy paths
# and is shared by them.

data "planetscale_database_postgres" "cluster" {
  id           = var.cluster_id
  organization = var.organization
}

data "planetscale_postgres_branch" "branch" {
  id           = data.planetscale_database_postgres.cluster.default_branch
  organization = var.organization
  database     = data.planetscale_database_postgres.cluster.name
}

resource "planetscale_postgres_branch_role" "app" {
  organization = var.organization
  database     = data.planetscale_database_postgres.cluster.name
  branch       = data.planetscale_postgres_branch.branch.name
  name         = var.role_name

  inherited_roles = [
    "pg_read_all_data",
    "pg_write_all_data",
  ]
}

resource "cloudflare_hyperdrive_config" "this" {
  account_id = var.account_id
  name       = var.hyperdrive_name

  origin = {
    scheme   = "postgres"
    database = var.db_name
    host     = planetscale_postgres_branch_role.app.access_host_url
    user     = planetscale_postgres_branch_role.app.username
    password = planetscale_postgres_branch_role.app.password
    # PgBouncer — Hyperdrive needs pooled connections, not direct (5432 is for migrations only).
    port = 6432
  }
}

# Schema changes need the `postgres` role, which the app role deliberately lacks.
# Permanent environments only: ephemeral ones share the permanent branch's schema,
# same as the `isPermanentStage` gate in infra/sst/cf/database.ts.
resource "planetscale_postgres_branch_role" "migrator" {
  count = var.migrator ? 1 : 0

  organization = var.organization
  database     = data.planetscale_database_postgres.cluster.name
  branch       = data.planetscale_postgres_branch.branch.name
  name         = var.migrator_role_name

  inherited_roles = [
    "pg_read_all_data",
    "pg_write_all_data",
    "postgres",
  ]
}

module "migrate" {
  source = "../local-command"

  enabled     = var.migrator && var.run_migrations
  working_dir = var.core_dir
  command     = "bun run db:migrate"

  # Port 5432: migrations want a direct connection, not PgBouncer.
  environment = {
    DATABASE_URL = var.migrator ? "postgresql://${planetscale_postgres_branch_role.migrator[0].username}:${planetscale_postgres_branch_role.migrator[0].password}@${planetscale_postgres_branch_role.migrator[0].access_host_url}:5432/${var.db_name}?sslmode=require" : ""
  }

  # Re-run when the migration SQL changes. A content hash rather than SST's
  # concatenated file bodies — same signal, bounded size.
  triggers = {
    migrations = sha256(join("", [
      for f in sort(tolist(fileset("${var.core_dir}/migrations", "**/*.sql"))) :
      filesha256("${var.core_dir}/migrations/${f}")
    ]))
  }
}
