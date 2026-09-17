# modules/bun-build/variables.tf

variable "package_dir" {
  description = "Package to build in. Pass an absolute path (e.g. \"$${local.repo_root}/packages/functions\") — relative paths resolve against the directory tofu was invoked from, not the module."
  type        = string
}

variable "entrypoint" {
  description = "Entrypoint relative to package_dir, e.g. src/api/target/worker.ts"
  type        = string
}

variable "outfile" {
  description = "Output file relative to package_dir, e.g. dist/api/worker.js. Give each service its own directory so main_module can stay a bare filename."
  type        = string
}

variable "target" {
  description = "bun build --target. `node` keeps node: builtins external, which is what nodejs_compat wants."
  type        = string
  default     = "node"

  validation {
    condition     = contains(["node", "browser", "bun"], var.target)
    error_message = "target must be one of: node, browser, bun."
  }
}

variable "format" {
  description = "bun build --format"
  type        = string
  default     = "esm"

  validation {
    condition     = contains(["esm", "cjs", "iife"], var.format)
    error_message = "format must be one of: esm, cjs, iife."
  }
}

variable "conditions" {
  description = "Comma-separated export conditions. `workerd` is what makes `postgres` resolve its Cloudflare build — `worker` alone does not match its exports map."
  type        = string
  default     = "workerd,worker,browser"
}

variable "sourcemap" {
  description = "bun build --sourcemap value (none | linked | inline | external). Null omits the flag."
  type        = string
  default     = null
}

variable "minify" {
  description = "Pass --minify."
  type        = bool
  default     = true
}

variable "external" {
  description = "Modules left unbundled. The Workers runtime supplies these itself under nodejs_compat."
  type        = list(string)
  default     = ["node:*", "cloudflare:*"]
}

variable "loader" {
  description = "Extension -> loader overrides, e.g. { \".css\" = \"text\" } for the auth worker's OpenAuth UI."
  type        = map(string)
  default     = {}
}


variable "enabled" {
  description = "Build during apply. Set false when CI already produced the artifact — the file must exist before apply, since nothing will create it."
  type        = bool
  default     = true
}

variable "globs" {
  description = "Globs within package_dir that are hashed to decide whether to rebuild."
  type        = list(string)
  default     = ["src/**/*.ts", "src/**/*.tsx", "package.json"]
}

variable "watch_dirs" {
  description = "Workspace dependencies to hash as well. A change in packages/core must rebuild every worker that bundles it."
  type = list(object({
    dir   = string
    globs = optional(list(string), ["src/**/*.ts", "src/**/*.tsx", "package.json"])
  }))
  default = []
}


variable "builder" {
  description = "Path to infra/terraform/build.ts. Passed in rather than derived from path.module, which does not survive Terraform copying a module into .terraform/."
  type        = string
}
