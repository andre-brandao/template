# modules/local-command/main.tf
#
# An apply-time shell command with a content-hash rebuild trigger — the generic
# half of bun-build, and the port of Pulumi's `command.local.Command` used by
# infra/sst/cf/dashboard.ts (the SvelteKit build) and .../database.ts (migrations).
#
# `build_id` is the load-bearing output: it is unknown at plan whenever a re-run
# is pending, which is what lets consumers defer their file reads to apply time.

terraform {
  required_version = ">= 1.4"
}

locals {
  watched = [for w in var.watch_dirs : { dir = abspath(w.dir), globs = w.globs }]

  source_hash = sha256(join("", flatten([
    for w in local.watched : [
      for f in sort(flatten([for g in w.globs : tolist(fileset(w.dir, g))])) :
      filesha256("${w.dir}/${f}")
    ]
  ])))
}

resource "terraform_data" "run" {
  count = var.enabled ? 1 : 0

  triggers_replace = merge(var.triggers, { sources = local.source_hash })

  provisioner "local-exec" {
    when        = create
    working_dir = abspath(var.working_dir)
    command     = var.command
    environment = var.environment
  }
}
