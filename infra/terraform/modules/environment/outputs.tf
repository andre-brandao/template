# modules/environment/outputs.tf

output "environment" {
  description = "The environment this resolved for."
  value       = var.environment
}

output "domain" {
  description = "The environment's domain. Prefix a service name to it to get a hostname."
  value       = local.domain
}

output "is_permanent" {
  description = "True for prod/dev, false for ephemeral PR environments."
  value       = local.is_permanent
}

output "is_ephemeral" {
  description = "Inverse of is_permanent — guards settings that should only apply to throwaway environments."
  value       = !local.is_permanent
}
