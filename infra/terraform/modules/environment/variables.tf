# modules/environment/variables.tf

variable "environment" {
  description = "Environment name. \"prod\" and \"dev\" are permanent; anything else (\"pr-123\") is ephemeral."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$", var.environment))
    error_message = "environment must be a DNS label: lowercase alphanumerics and hyphens, max 32 chars, not starting or ending with a hyphen."
  }
}

variable "base_domain" {
  description = "Root the environment domains hang off. The `tf.` label keeps every Terraform-managed hostname on a branch the SST stack never touches."
  type        = string
  default     = "tf.template.developing.company"
}

variable "permanent_environments" {
  description = "Environments that are long-lived. Everything else is ephemeral."
  type        = list(string)
  default     = ["prod", "dev"]
}
