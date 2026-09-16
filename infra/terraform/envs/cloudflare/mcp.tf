# envs/cloudflare/mcp.tf — ports infra/sst/cf/mcp.ts
#
# NOTE: packages/functions/src/mcp/target/worker.ts reads env.Jobs, but
# infra/sst/cf/mcp.ts links only [database, hyperdrive] — on the SST path that
# queue provider is constructed over undefined. This binds it (var.mcp_bind_queue);
# infra/sst/cf/mcp.ts should be fixed to match, separately.

module "build_mcp" {
  source = "../../modules/bun-build"

  enabled     = var.build
  builder     = local.builder
  package_dir = local.functions_dir
  entrypoint  = "src/mcp/target/worker.ts"
  outfile     = "dist/mcp/worker.js"
  watch_dirs  = local.core_watch
}

module "mcp" {
  source = "../../modules/worker"

  account_id    = var.account_id
  name          = "${local.prefix}-mcp"
  artifact_path = module.build_mcp.artifact_path
  build_id      = module.build_mcp.build_id

  subdomain   = var.mcp_subdomain
  domain      = module.environment.domain
  zone_name   = var.zone_name
  workers_dev = var.workers_dev

  compatibility_date  = var.compatibility_date
  compatibility_flags = var.compatibility_flags

  bindings = concat(
    local.environment_bindings,
    [local.binding_hyperdrive],
    var.mcp_bind_queue ? [local.binding_jobs] : [],
  )

  observability_sampling_rate = module.environment.is_ephemeral ? 1 : var.observability_sampling_rate
  logpush                     = var.logpush

  depends_on = [module.database]
}
