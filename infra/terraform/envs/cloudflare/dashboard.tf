# envs/cloudflare/dashboard.tf — ports infra/sst/cf/dashboard.ts
#
# The one worker that is not a bun-build: SvelteKit's cloudflare adapter emits
# _worker.js plus a static asset tree, so the build is `bun run build` and the
# module gets an assets directory as well as an entry module.

module "build_dashboard" {
  source = "../../modules/local-command"

  enabled     = var.build
  working_dir = local.dashboard_dir
  command     = "bun run build"

  # Also a runtime var, not just a build one: hooks/server/providers.ts picks its
  # provider set from it, since the Hyperdrive/R2 bindings are per-request here.
  environment = { SVELTE_ADAPTER = "cloudflare" }

  watch_dirs = [
    { dir = local.dashboard_dir, globs = ["src/**", "static/**", "vite.config.ts", "package.json"] },
    { dir = "${local.repo_root}/packages/ui", globs = ["src/**", "package.json"] },
    { dir = "${local.repo_root}/packages/sdk/ts", globs = ["src/**", "package.json"] },
    { dir = local.core_dir, globs = ["src/**", "package.json"] },
  ]
}

module "dashboard" {
  source = "../../modules/worker"

  account_id = var.account_id
  name       = "${local.prefix}-dashboard"

  artifact_path    = "${local.dashboard_dir}/.svelte-kit/cloudflare/_worker.js"
  assets_directory = "${local.dashboard_dir}/.svelte-kit/cloudflare"
  build_id         = module.build_dashboard.build_id

  subdomain   = var.dashboard_subdomain
  domain      = module.environment.domain
  zone_name   = var.zone_name
  workers_dev = var.workers_dev

  compatibility_date  = var.compatibility_date
  compatibility_flags = var.compatibility_flags

  bindings = concat(local.environment_bindings, [
    local.binding_hyperdrive,
    local.binding_files,
    local.binding_jobs,
    { name = "SVELTE_ADAPTER", type = "plain_text", text = "cloudflare" },
  ])

  observability_sampling_rate = module.environment.is_ephemeral ? 1 : var.observability_sampling_rate
  logpush                     = var.logpush

  depends_on = [module.database]
}
