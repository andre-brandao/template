# envs/cloudflare/locals.tf

locals {
  # envs/cloudflare -> envs -> terraform -> infra -> repo root
  repo_root     = abspath("${path.root}/../../../..")
  functions_dir = "${local.repo_root}/packages/functions"
  dashboard_dir = "${local.repo_root}/apps/dashboard"
  core_dir      = "${local.repo_root}/packages/core"

  # The bundler modules/bun-build shells out to. Absolute, so it survives
  # Terraform relocating a module.
  builder = abspath("${path.root}/../../build.ts")

  # The unnamed default workspace is the everyday shared environment.
  environment = terraform.workspace == "default" ? var.default_environment : terraform.workspace

  # Account-scoped names (queues, buckets, KV, Hyperdrive) are not namespaced by
  # DNS, so this prefix is what keeps them off the SST stack's names. SST appends
  # a random suffix; Terraform is deterministic, so the prefix has to do the work.
  prefix = "${var.project}-${local.environment}"

  # Every worker bundles packages/core, so a change there has to rebuild all of them.
  core_watch = [{ dir = local.core_dir, globs = ["src/**/*.ts", "package.json"] }]

  # Resource bindings, by the exact names packages/functions/src/cf.ts declares.
  binding_hyperdrive = { name = "Hyperdrive", type = "hyperdrive", id = module.database.hyperdrive_id }
  binding_files      = { name = "Files", type = "r2_bucket", bucket_name = cloudflare_r2_bucket.files.name }
  binding_jobs       = { name = "Jobs", type = "queue", queue_name = module.queue.queue_name }
  binding_email      = { name = "SEND_EMAIL", type = "send_email" }
}
