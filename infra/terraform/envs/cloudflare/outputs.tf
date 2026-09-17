# envs/cloudflare/outputs.tf

output "environment" {
  description = "Environment this workspace deploys."
  value       = module.environment.environment
}

output "environment_domain" {
  description = "Domain for this environment."
  value       = module.environment.domain
}

output "dashboard" {
  description = "Public URL for the dashboard."
  value       = module.dashboard.url
}

output "api" {
  description = "Public URL for the API."
  value       = module.api.url
}

output "mcp" {
  description = "Public URL for the MCP server."
  value       = module.mcp.url
}

output "auth" {
  description = "Public URL for the auth issuer."
  value       = module.auth.url
}

output "queue_name" {
  description = "Jobs queue backing the consumer."
  value       = module.queue.queue_name
}

output "hyperdrive_id" {
  description = "Hyperdrive config every worker connects through."
  value       = module.database.hyperdrive_id
}

output "files_bucket" {
  description = "R2 bucket bound as `Files`."
  value       = cloudflare_r2_bucket.files.name
}
