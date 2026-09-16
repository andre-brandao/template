# envs/cloudflare/database.tf — ports infra/sst/cf/database.ts

module "environment" {
  source = "../../modules/environment"

  environment = local.environment
  base_domain = var.base_domain
}

module "database" {
  source = "../../modules/database"

  account_id   = var.account_id
  organization = var.planetscale_organization
  cluster_id   = var.planetscale_cluster_id
  db_name      = var.db_name
  core_dir     = local.core_dir

  role_name          = local.prefix
  migrator_role_name = "${var.project}-migrator-${local.environment}"
  hyperdrive_name    = "${local.prefix}-hyperdrive"

  # Ephemeral environments share the permanent branch's schema, so they neither
  # get a migrator role nor run migrations — same gate as isPermanentStage.
  migrator       = module.environment.is_permanent
  run_migrations = var.run_migrations
}
