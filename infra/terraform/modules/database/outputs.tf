# modules/database/outputs.tf

output "hyperdrive_id" {
  description = "Hyperdrive config id, for the workers' `Hyperdrive` binding."
  value       = cloudflare_hyperdrive_config.this.id
}

output "hyperdrive_name" {
  description = "Hyperdrive config name."
  value       = cloudflare_hyperdrive_config.this.name
}

output "role_name" {
  description = "The application role that was created."
  value       = planetscale_postgres_branch_role.app.name
}

output "database_url" {
  description = "Direct (non-pooled) connection string for the app role."
  value       = "postgresql://${planetscale_postgres_branch_role.app.username}:${planetscale_postgres_branch_role.app.password}@${planetscale_postgres_branch_role.app.access_host_url}:5432/${var.db_name}?sslmode=require"
  sensitive   = true
}

output "migrated" {
  description = "Migration run identity. depends_on this to keep workers from serving a schema that has not been applied."
  value       = module.migrate.build_id
}
