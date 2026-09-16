# envs/cloudflare/providers.tf

# Reads CLOUDFLARE_API_TOKEN from the environment. The token needs
# "Workers Scripts: Edit", "Queues: Edit", "D1/R2/KV: Edit" as applicable, plus
# access to the zone that owns var.zone_name for the custom domains.
provider "cloudflare" {}

# Reads PLANETSCALE_SERVICE_TOKEN_ID / PLANETSCALE_SERVICE_TOKEN.
provider "planetscale" {}
