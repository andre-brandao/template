# modules/database/variables.tf

variable "account_id" {
  description = "Cloudflare account ID, for the Hyperdrive config."
  type        = string
}

variable "organization" {
  description = "PlanetScale organization."
  type        = string
  default     = "andrebrandao"
}

variable "cluster_id" {
  description = "PlanetScale Postgres cluster to look up. Never created here — it is shared with the SST path."
  type        = string
  default     = "agents"
}

variable "db_name" {
  description = "Database name inside the cluster."
  type        = string
  default     = "testing"
}

variable "role_name" {
  description = "Name for the application's Postgres role."
  type        = string
}

variable "migrator_role_name" {
  description = "Name for the migrator role. Only created when migrator = true."
  type        = string
}

variable "hyperdrive_name" {
  description = "Hyperdrive config name. Account-scoped, so keep the project + environment prefix."
  type        = string
}

variable "migrator" {
  description = "Create the migrator role. Permanent environments only — ephemeral ones share the permanent branch's schema."
  type        = bool
  default     = false
}

variable "run_migrations" {
  description = "Run `bun run db:migrate` during apply. Needs a real `node` on PATH: drizzle-kit uses node:sqlite, which Bun does not provide."
  type        = bool
  default     = true
}

variable "core_dir" {
  description = "Absolute path to packages/core — where db:migrate runs and migrations/ lives."
  type        = string
}
