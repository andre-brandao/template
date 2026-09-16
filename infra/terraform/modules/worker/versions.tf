# modules/worker/versions.tf
terraform {
  required_version = ">= 1.4"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 5.11" # assets.directory on workers_script landed in 5.11
    }
    local = {
      source  = "hashicorp/local"
      version = ">= 2.9"
    }
  }
}
