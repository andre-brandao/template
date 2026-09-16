# modules/database/versions.tf
terraform {
  required_version = ">= 1.4"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 5.11"
    }
    planetscale = {
      source  = "planetscale/planetscale"
      version = ">= 1.3"
    }
  }
}
