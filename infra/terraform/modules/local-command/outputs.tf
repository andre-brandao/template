# modules/local-command/outputs.tf

output "build_id" {
  description = "Changes on every re-run; \"prebuilt\" when enabled = false. Unknown at plan while a re-run is pending, which is what defers consumers' file reads."
  value       = try(terraform_data.run[0].id, "prebuilt")
}

output "source_hash" {
  description = "Hash of the watched sources."
  value       = local.source_hash
}
