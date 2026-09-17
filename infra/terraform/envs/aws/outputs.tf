# envs/aws/outputs.tf

output "environment" {
  description = "Environment this workspace would deploy."
  value       = module.environment.environment
}

output "environment_domain" {
  description = "Domain for this environment."
  value       = module.environment.domain
}

output "prefix" {
  description = "Name prefix every resource here would carry."
  value       = local.prefix
}
