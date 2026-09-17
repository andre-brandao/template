# envs/aws/providers.tf

# Credentials come from the usual AWS chain (env vars, profile, SSO).
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.tags
  }
}
