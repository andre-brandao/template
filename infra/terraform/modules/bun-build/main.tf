# modules/bun-build/main.tf
#
# Runs `bun build` at apply time and hands the artifact path to the caller.
#
# The bundle deliberately does NOT exist at plan time, so every consumer has to
# read it through something that carries a `depends_on` edge back to this
# module (see modules/worker).

terraform {
  required_version = ">= 1.4"
}

locals {
  # The package itself is always watched; watch_dirs adds the workspace deps a
  # change in which must also force a rebuild (packages/core, packages/ui, ...).
  watched = concat(
    [{ dir = abspath(var.package_dir), globs = var.globs }],
    [for w in var.watch_dirs : { dir = abspath(w.dir), globs = w.globs }],
  )

  # Any watched source changing -> new hash -> terraform_data is replaced ->
  # the provisioner runs again. This is the rebuild trigger.
  source_hash = sha256(join("", flatten([
    for w in local.watched : [
      for f in sort(flatten([for g in w.globs : tolist(fileset(w.dir, g))])) :
      filesha256("${w.dir}/${f}")
    ]
  ])))

  # ../../build.ts, not `bun build`: the CLI's --conditions does not override a
  # package's exports map, so `postgres` resolves to its Node build and drags
  # net/tls into the bundle. Bun.build({ conditions }) does apply them, which is
  # what selects postgres's `workerd` export. See that file's header.
  builder = abspath(var.builder)

  command = join(" ", compact(concat(
    [
      "bun run", local.builder,
      "--entry='${var.entrypoint}'",
      "--outfile='${var.outfile}'",
      "--target=${var.target}",
      "--format=${var.format}",
      var.conditions != null ? "--conditions='${var.conditions}'" : "",
      var.sourcemap != null ? "--sourcemap=${var.sourcemap}" : "",
      var.minify ? "" : "--minify=false",
    ],
    [for e in var.external : "--external='${e}'"],
    [for k, v in var.loader : "--loader='${k}:${v}'"],
  )))

  artifact_path = "${abspath(var.package_dir)}/${var.outfile}"
}

resource "terraform_data" "build" {
  count = var.enabled ? 1 : 0

  # Rebuild when sources change OR when the build flags themselves change.
  triggers_replace = {
    sources = local.source_hash
    command = local.command
  }

  provisioner "local-exec" {
    when        = create
    working_dir = abspath(var.package_dir)
    command     = local.command
  }
}
