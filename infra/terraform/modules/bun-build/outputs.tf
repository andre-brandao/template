# modules/bun-build/outputs.tf

output "artifact_path" {
  description = "Absolute path to the built bundle."
  value       = local.artifact_path
}

output "artifact_dir" {
  description = "Absolute path to the directory containing the bundle."
  value       = dirname(local.artifact_path)
}

output "artifact_file" {
  description = "Bare filename of the bundle (what Workers wants as main_module)."
  value       = basename(local.artifact_path)
}

output "source_hash" {
  description = "Hash of the watched sources — stable across runs when nothing changed."
  value       = local.source_hash
}

output "build_id" {
  description = "Changes on every rebuild; \"prebuilt\" when enabled = false. Thread this into consumers to defer their file reads to apply time."
  value       = try(terraform_data.build[0].id, "prebuilt")
}
