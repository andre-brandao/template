# envs/cloudflare/variables.tf

variable "project" {
  description = <<-EOT
    Name prefix for every account-scoped resource. Queue, R2, KV and Hyperdrive
    names are account-global and Terraform does not add SST's random suffix, so
    this is what keeps the two stacks from colliding. Do not set it to "template".
  EOT
  type        = string
  default     = "template-tf"
}

variable "default_environment" {
  description = "Environment to assume when running in the unnamed default workspace. Every other workspace names its own environment."
  type        = string
  default     = "dev"
}

variable "base_domain" {
  description = "Root the environment domains hang off. The `tf.` label keeps these hostnames disjoint from the SST stack's."
  type        = string
  default     = "tf.template.developing.company"
}

variable "zone_name" {
  description = "Cloudflare zone that owns base_domain."
  type        = string
  default     = "developing.company"
}

variable "account_id" {
  description = "Cloudflare account ID. Normally left unset: the repo .envrc exports TF_VAR_account_id from $CLOUDFLARE_DEFAULT_ACCOUNT_ID."
  type        = string
  default     = null

  validation {
    condition     = var.account_id != null && var.account_id != ""
    error_message = "No Cloudflare account ID. Either `direnv allow` (which bridges $CLOUDFLARE_DEFAULT_ACCOUNT_ID for you) or run: export TF_VAR_account_id=\"$CLOUDFLARE_DEFAULT_ACCOUNT_ID\""
  }
}

variable "build" {
  description = "Bundle the app during apply. Set false in CI when the artifacts already exist — nothing else will create them."
  type        = bool
  default     = true
}

variable "run_migrations" {
  description = "Run drizzle migrations during apply on permanent environments. Needs a real `node` on PATH."
  type        = bool
  default     = true
}

variable "compatibility_date" {
  description = "Workers runtime compatibility date."
  type        = string
  default     = "2026-03-19"
}

variable "compatibility_flags" {
  description = "Workers compatibility flags."
  type        = list(string)
  default     = ["nodejs_compat"]
}

variable "workers_dev" {
  description = "Also expose each public worker on *.workers.dev."
  type        = bool
  default     = false
}

variable "observability_sampling_rate" {
  description = "Head sampling rate for Workers Logs on permanent environments. Ephemeral ones always log everything."
  type        = number
  default     = 1
}

variable "logpush" {
  description = "Ship logs to a configured Logpush job."
  type        = bool
  default     = false
}

# --- PlanetScale -------------------------------------------------------------

variable "planetscale_organization" {
  description = "PlanetScale organization."
  type        = string
  default     = "andrebrandao"
}

variable "planetscale_cluster_id" {
  description = "PlanetScale Postgres cluster to look up. Shared with the SST path; never created here."
  type        = string
  default     = "agents"
}

variable "db_name" {
  description = "Database name inside the cluster."
  type        = string
  default     = "testing"
}

# --- Queue -------------------------------------------------------------------

variable "queue_batch_size" {
  description = "Messages delivered to the consumer per batch."
  type        = number
  default     = 10
}

variable "queue_max_retries" {
  description = "Delivery attempts before a message goes to the dead letter queue."
  type        = number
  default     = 3
}

variable "queue_max_wait_time_ms" {
  description = "How long Cloudflare waits to fill a batch."
  type        = number
  default     = 5000
}

# --- Per-service subdomains --------------------------------------------------
# Each is joined to the environment domain with a dot, so "api" in the dev
# environment becomes api.dev.tf.template.developing.company. Adding a service
# means another module call with its own subdomain.

variable "api_subdomain" {
  description = "Subdomain for the API worker."
  type        = string
  default     = "api"
}

variable "mcp_subdomain" {
  description = "Subdomain for the MCP worker."
  type        = string
  default     = "mcp"
}

variable "auth_subdomain" {
  description = "Subdomain for the auth issuer. Also composes AUTH_URL — see secrets.tf."
  type        = string
  default     = "auth"
}

variable "dashboard_subdomain" {
  description = "Subdomain for the SvelteKit dashboard."
  type        = string
  default     = "dashboard"
}

variable "mcp_bind_queue" {
  description = <<-EOT
    Give the MCP worker the `Jobs` binding. Its target reads env.Jobs, but
    infra/sst/cf/mcp.ts never links the queue, so on SST that provider is built
    over undefined. Bound here by default; see the note in mcp.tf.
  EOT
  type        = bool
  default     = true
}
