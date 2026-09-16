# envs/cloudflare/api.tf — ports infra/sst/cf/api.ts

module "build_api" {
  source = "../../modules/bun-build"

  enabled     = var.build
  builder     = local.builder
  package_dir = local.functions_dir
  entrypoint  = "src/api/target/worker.ts"
  outfile     = "dist/api/worker.js"
  watch_dirs  = local.core_watch
}

module "api" {
  source = "../../modules/worker"

  account_id    = var.account_id
  name          = "${local.prefix}-api"
  artifact_path = module.build_api.artifact_path
  build_id      = module.build_api.build_id

  subdomain   = var.api_subdomain
  domain      = module.environment.domain
  zone_name   = var.zone_name
  workers_dev = var.workers_dev

  compatibility_date  = var.compatibility_date
  compatibility_flags = var.compatibility_flags

  bindings = concat(local.environment_bindings, [
    local.binding_hyperdrive,
    local.binding_files,
    local.binding_jobs,
  ])

  observability_sampling_rate = module.environment.is_ephemeral ? 1 : var.observability_sampling_rate
  logpush                     = var.logpush

  depends_on = [module.database]
}
