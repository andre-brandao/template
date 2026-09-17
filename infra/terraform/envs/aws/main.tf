# envs/aws/main.tf
#
# Stub. Declares the environment and the naming scheme so the wiring is obvious,
# but no compute — see README.md.

locals {
  # envs/aws -> envs -> terraform -> infra -> repo root
  repo_root     = abspath("${path.root}/../../../..")
  functions_dir = "${local.repo_root}/packages/functions"

  environment = terraform.workspace == "default" ? var.default_environment : terraform.workspace
  prefix      = "${var.project}-${local.environment}"

  tags = merge(var.tags, {
    Project     = var.project
    Environment = local.environment
    ManagedBy   = "opentofu"
  })
}

module "environment" {
  source = "../../modules/environment"

  environment = local.environment
  base_domain = var.base_domain
}
