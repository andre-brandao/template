# modules/worker/outputs.tf

output "script_name" {
  description = "Deployed worker script name."
  value       = cloudflare_workers_script.this.script_name
}

output "etag" {
  description = "Etag of the deployed script — changes whenever new code lands."
  value       = cloudflare_workers_script.this.etag
}

output "hostname" {
  description = "Composed public hostname, or null when no custom domain is configured."
  value       = local.custom_domain ? local.hostname : null
}

output "custom_domain_url" {
  description = "https:// URL for the custom domain, or null when unset."
  value       = local.custom_domain ? "https://${local.hostname}" : null
}

output "routes" {
  description = "Route patterns bound to this worker."
  value       = [for r in cloudflare_workers_route.this : r.pattern]
}

output "workers_dev_enabled" {
  description = "Whether the *.workers.dev URL is live."
  value       = var.workers_dev
}

output "url" {
  description = <<-EOT
    The public URL to hit: the custom domain, else the first route. Null when
    neither is configured — the workers.dev URL cannot be rendered here because
    Cloudflare exposes no data source for the account's workers.dev subdomain.
  EOT

  value = try(coalesce(
    local.custom_domain ? "https://${local.hostname}" : null,
    length(var.routes) == 0 ? null : "https://${trimsuffix(var.routes[0].pattern, "/*")}",
  ), null)
}

output "source_hash" {
  description = "Build identity the deployed script came from."
  value       = var.build_id
}
