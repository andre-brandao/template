# modules/worker/main.tf
#
# One Cloudflare Worker from an already-built bundle. Unlike hono-terraform's
# hono-worker this module never builds: there are five workers here across two
# different build mechanisms, so the caller builds and passes the artifact in.

# Carries the caller's build_id so the reads below have something to depend on
# without this module knowing how the build happened.
resource "terraform_data" "gate" {
  input = var.build_id
}

# depends_on defers this read to apply time — that is the whole trick. Without
# it, tofu would try to read the bundle during plan, before it exists.
#
# Only the hash is used. When a rebuild is pending the read is deferred, so the
# hash is "known after apply" and the script updates; when nothing changed the
# read happens at plan and the hash matches state, so there is no diff.
data "local_file" "entry" {
  filename   = var.artifact_path
  depends_on = [terraform_data.gate]
}

locals {
  # An explicit hostname wins; otherwise compose one from subdomain + domain.
  # Composed here rather than by modules/environment so a second service is
  # just another module call with a different subdomain.
  hostname = (
    var.hostname != null ? var.hostname :
    var.domain != null && var.subdomain != null ? "${var.subdomain}.${var.domain}" :
    null
  )

  # A hostname alone is not enough — Cloudflare needs to know which zone owns it.
  custom_domain = local.hostname != null && (var.zone_name != null || var.zone_id != null)

  # `assets.directory` is a plain string, so the provider would stat it during
  # plan — but SvelteKit only writes that directory during apply. Routing it
  # through the gate's output makes the expression unknown-at-plan whenever a
  # rebuild is pending, which is the HCL equivalent of SST's
  # `build.stdout.apply(() => path)` in infra/sst/cf/dashboard.ts.
  assets_directory = (
    var.assets_directory == null ? null :
    terraform_data.gate.output == "" ? null :
    var.assets_directory
  )
}

resource "cloudflare_workers_script" "this" {
  account_id  = var.account_id
  script_name = var.name

  # content_file rather than content: with `content` set, the provider's Read
  # overwrites state from the remote body, so every plan re-diffs the whole
  # bundle and prints all of it. With `content_file` it skips `content`
  # entirely and reconciles on the hash alone.
  content_file   = var.artifact_path
  content_sha256 = data.local_file.entry.content_sha256
  main_module    = basename(var.artifact_path)

  compatibility_date  = var.compatibility_date
  compatibility_flags = var.compatibility_flags

  bindings = var.bindings
  logpush  = var.logpush

  # The v5 provider is generated from Cloudflare's OpenAPI spec, so every nested
  # object is an attribute, not a block — no `dynamic` here, just null.
  assets    = local.assets_directory == null ? null : { directory = local.assets_directory }
  placement = var.placement

  observability = {
    enabled            = var.observability_enabled
    head_sampling_rate = var.observability_sampling_rate
    logs = {
      enabled            = var.observability_enabled
      invocation_logs    = var.invocation_logs
      head_sampling_rate = var.observability_sampling_rate
    }
  }

  lifecycle {
    precondition {
      condition     = var.placement == null || var.assets_directory == null
      error_message = "placement cannot be combined with assets_directory: Cloudflare does not support smart placement on Workers with static assets."
    }
  }
}

# The *.workers.dev preview URL. Turn off once real routes exist.
resource "cloudflare_workers_script_subdomain" "this" {
  count = var.workers_dev ? 1 : 0

  account_id       = var.account_id
  script_name      = cloudflare_workers_script.this.script_name
  enabled          = true
  previews_enabled = var.previews_enabled
}

# Zone routes, e.g. api.example.com/* -> this worker.
resource "cloudflare_workers_route" "this" {
  for_each = { for r in var.routes : r.pattern => r }

  zone_id = each.value.zone_id
  pattern = each.value.pattern
  script  = cloudflare_workers_script.this.script_name
}

# A real public hostname. Unlike a route, this provisions the DNS record and
# the edge cert itself, so the zone needs no pre-existing record.
resource "cloudflare_workers_custom_domain" "this" {
  count = local.custom_domain ? 1 : 0

  account_id = var.account_id
  hostname   = local.hostname
  zone_id    = var.zone_id
  zone_name  = var.zone_name
  service    = cloudflare_workers_script.this.script_name
}
