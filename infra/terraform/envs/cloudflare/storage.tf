# envs/cloudflare/storage.tf — ports infra/sst/cf/storage.ts

resource "cloudflare_r2_bucket" "files" {
  account_id = var.account_id
  name       = "${local.prefix}-files"
}
