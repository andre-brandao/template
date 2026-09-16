# envs/cloudflare/auth.tf — ports infra/sst/cf/auth.ts

resource "cloudflare_workers_kv_namespace" "auth" {
  account_id = var.account_id
  title      = "${local.prefix}-auth-kv"
}

module "build_auth" {
  source = "../../modules/bun-build"

  enabled     = var.build
  builder     = local.builder
  package_dir = local.functions_dir
  entrypoint  = "src/auth/target/worker.ts"
  outfile     = "dist/auth/worker.js"
  watch_dirs  = local.core_watch

  # OpenAuth's UI imports CSS; SST does this with build.loader.
  loader = { ".css" = "text" }
}

module "auth" {
  source = "../../modules/worker"

  account_id    = var.account_id
  name          = "${local.prefix}-auth"
  artifact_path = module.build_auth.artifact_path
  build_id      = module.build_auth.build_id

  subdomain   = var.auth_subdomain
  domain      = module.environment.domain
  zone_name   = var.zone_name
  workers_dev = var.workers_dev

  compatibility_date  = var.compatibility_date
  compatibility_flags = var.compatibility_flags

  bindings = concat(local.environment_bindings, [
    local.binding_hyperdrive,
    local.binding_email,
    { name = "AuthKv", type = "kv_namespace", namespace_id = cloudflare_workers_kv_namespace.auth.id },
  ])

  observability_sampling_rate = module.environment.is_ephemeral ? 1 : var.observability_sampling_rate
  logpush                     = var.logpush

  depends_on = [module.database]
}
