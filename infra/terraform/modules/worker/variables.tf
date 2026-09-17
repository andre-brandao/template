# modules/worker/variables.tf

variable "account_id" {
  description = "Cloudflare account ID."
  type        = string
}

variable "name" {
  description = "Worker script name."
  type        = string
}

variable "artifact_path" {
  description = "Absolute path to the built entry module. The caller builds it; this module only uploads it."
  type        = string
}

variable "build_id" {
  description = "Build identity from the module that produced artifact_path. Threaded in purely to create the dependency edge that defers file reads to apply time."
  type        = string
}

variable "assets_directory" {
  description = "Directory of static assets to upload alongside the script. Null for a code-only worker."
  type        = string
  default     = null
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

variable "bindings" {
  description = <<-EOT
    Worker bindings. Each entry needs `name` + `type`; the rest depend on the type:

      { name = "SESSION_SECRET", type = "secret_text",  text         = var.session_secret }
      { name = "ENVIRONMENT",    type = "plain_text",   text         = "dev" }
      { name = "Hyperdrive",     type = "hyperdrive",   id           = "..." }
      { name = "Files",          type = "r2_bucket",    bucket_name  = "..." }
      { name = "Jobs",           type = "queue",        queue_name   = "..." }
      { name = "AuthKv",         type = "kv_namespace", namespace_id = "..." }
      { name = "SEND_EMAIL",     type = "send_email" }
  EOT

  type = list(object({
    name                          = string
    type                          = string
    text                          = optional(string)
    json                          = optional(string)
    id                            = optional(string)
    namespace_id                  = optional(string)
    bucket_name                   = optional(string)
    queue_name                    = optional(string)
    database_id                   = optional(string)
    service                       = optional(string)
    entrypoint                    = optional(string)
    environment                   = optional(string)
    class_name                    = optional(string)
    script_name                   = optional(string)
    dataset                       = optional(string)
    index_name                    = optional(string)
    secret_name                   = optional(string)
    store_id                      = optional(string)
    destination_address           = optional(string)
    allowed_destination_addresses = optional(list(string))
  }))

  default   = []
  sensitive = true
}

variable "subdomain" {
  description = "Service label joined to var.domain with a dot, so \"api\" + dev.tf.template.developing.company becomes api.dev.tf.template.developing.company. Null serves only on workers.dev / routes."
  type        = string
  default     = null
}

variable "domain" {
  description = "Environment domain to publish under, from modules/environment. Combined with var.subdomain to form the hostname."
  type        = string
  default     = null
}

variable "hostname" {
  description = "Exact hostname, bypassing the subdomain + domain composition entirely."
  type        = string
  default     = null
}

variable "zone_name" {
  description = "Cloudflare zone that owns the hostname. Either this or zone_id is required for a custom domain."
  type        = string
  default     = null
}

variable "zone_id" {
  description = "Cloudflare zone id that owns the hostname. Either this or zone_name is required for a custom domain."
  type        = string
  default     = null
}

variable "routes" {
  description = "Zone routes to attach, e.g. [{ pattern = \"api.example.com/*\", zone_id = \"...\" }]."
  type = list(object({
    pattern = string
    zone_id = string
  }))
  default = []
}

variable "workers_dev" {
  description = "Expose the worker on <name>.<subdomain>.workers.dev."
  type        = bool
  default     = false
}

variable "previews_enabled" {
  description = "Allow per-version preview URLs on the workers.dev subdomain."
  type        = bool
  default     = false
}

variable "placement" {
  description = <<-EOT
    Worker placement. The provider exposes `mode` only ("smart"); the regional
    pinning infra/sst/cf/* does with `placement.region = "aws:sa-east-1"` has no
    Terraform equivalent yet. Leave null on any worker that also ships assets —
    Cloudflare rejects smart placement combined with static assets.
  EOT
  type = object({
    mode = optional(string)
  })
  default = null
}

variable "observability_enabled" {
  description = "Enable Workers Logs."
  type        = bool
  default     = true
}

variable "observability_sampling_rate" {
  description = "Head sampling rate for Workers Logs (0.0 - 1.0)."
  type        = number
  default     = 1

  validation {
    condition     = var.observability_sampling_rate >= 0 && var.observability_sampling_rate <= 1
    error_message = "observability_sampling_rate must be between 0 and 1."
  }
}

variable "logpush" {
  description = "Ship logs to a configured Logpush job."
  type        = bool
  default     = false
}

variable "invocation_logs" {
  description = "Emit one log line per invocation. Off on every SST worker, so off here too."
  type        = bool
  default     = false
}
