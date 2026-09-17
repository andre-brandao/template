# modules/local-command/variables.tf

variable "working_dir" {
  description = "Absolute path the command runs in."
  type        = string
}

variable "command" {
  description = "Shell command to run at apply time."
  type        = string
}

variable "environment" {
  description = "Environment variables for the command. Sensitive: the migration runner passes DATABASE_URL through here."
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "triggers" {
  description = "Extra replace triggers merged with the source hash — e.g. a hash over the migrations directory."
  type        = map(string)
  default     = {}
}

variable "watch_dirs" {
  description = "Directories whose contents are hashed to decide whether to re-run."
  type = list(object({
    dir   = string
    globs = optional(list(string), ["src/**/*.ts", "package.json"])
  }))
  default = []
}

variable "enabled" {
  description = "Run during apply. False makes this a no-op and pins build_id to \"prebuilt\"."
  type        = bool
  default     = true
}
