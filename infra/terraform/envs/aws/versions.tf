# envs/aws/versions.tf
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.61"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.8" # archive_file as a managed resource landed in 2.5
    }
  }

  # See envs/cloudflare/versions.tf for the R2-flavoured equivalent.
  #
  # backend "s3" {
  #   bucket       = "my-tfstate"
  #   key          = "template/aws.tfstate"
  #   region       = "us-east-1"
  #   use_lockfile = true
  #   encrypt      = true
  # }
}
