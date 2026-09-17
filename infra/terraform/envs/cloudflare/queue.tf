# envs/cloudflare/queue.tf — ports infra/sst/cf/queue.ts
#
# Retries and burial live here, not in the driver — the adapter only pushes, so
# QUEUE_RETRIES/QUEUE_BACKOFF do not apply on Cloudflare.

module "queue" {
  source = "../../modules/queue"

  account_id = var.account_id
  name       = "${local.prefix}-jobs"
  dlq_name   = "${local.prefix}-jobs-dlq"
}

module "build_queue" {
  source = "../../modules/bun-build"

  enabled     = var.build
  builder     = local.builder
  package_dir = local.functions_dir
  entrypoint  = "src/queue/target/worker.ts"
  outfile     = "dist/queue/worker.js"
  watch_dirs  = local.core_watch
}

# No domain and no workers.dev: this worker is only ever reached by the queue.
module "queue_consumer" {
  source = "../../modules/worker"

  account_id    = var.account_id
  name          = "${local.prefix}-queue"
  artifact_path = module.build_queue.artifact_path
  build_id      = module.build_queue.build_id

  compatibility_date  = var.compatibility_date
  compatibility_flags = var.compatibility_flags

  # Handlers may enqueue follow-ups and send mail, so it needs both bindings.
  bindings = concat(local.environment_bindings, [
    local.binding_hyperdrive,
    local.binding_files,
    local.binding_jobs,
    local.binding_email,
  ])

  observability_sampling_rate = module.environment.is_ephemeral ? 1 : var.observability_sampling_rate
  logpush                     = var.logpush

  depends_on = [module.database]
}

resource "cloudflare_queue_consumer" "jobs" {
  account_id  = var.account_id
  queue_id    = module.queue.queue_id
  script_name = module.queue_consumer.script_name
  type        = "worker"

  settings = {
    batch_size       = var.queue_batch_size
    max_retries      = var.queue_max_retries
    max_wait_time_ms = var.queue_max_wait_time_ms
  }

  dead_letter_queue = module.queue.dlq_name
}
