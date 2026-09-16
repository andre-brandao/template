# envs/cloudflare/versions.tf
terraform {
  required_version = ">= 1.6"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.24"
    }
    planetscale = {
      source  = "planetscale/planetscale"
      version = "~> 1.3"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.9"
    }
  }

  # State is local by default so the repo runs with zero setup. Workspaces
  # still work locally (terraform.tfstate.d/<environment>/), but CI-driven PR
  # environments need a shared backend — uncomment this and run
  #   tofu init -backend-config=backend.hcl
  #
  # OpenTofu prefixes workspace state automatically, so one key serves every
  # environment: env:/pr-123/template/cloudflare.tfstate
  #
  # NOTE: the state holds a live Postgres password (Hyperdrive needs the
  # plaintext), so a shared backend or native state encryption is strongly
  # preferred over leaving terraform.tfstate on disk.
  #
  # backend "s3" {
  #   bucket = "tfstate"
  #   key    = "template/cloudflare.tfstate"
  #   region = "auto"
  #
  #   endpoints = { s3 = "https://<account-id>.r2.cloudflarestorage.com" }
  #
  #   # R2 is not really S3: skip the AWS-isms, keep the lockfile.
  #   use_lockfile                = true
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  #   skip_region_validation      = true
  #   skip_requesting_account_id  = true
  #   skip_s3_checksum            = true
  #   use_path_style              = true
  # }
}
