# envs/cloudflare/secrets.tf
#
# The Terraform half of infra/sst/cf/secrets.ts. There is no `sst secret set`
# here: every value arrives as TF_VAR_<name>, which OpenTofu auto-loads. Each is
# marked sensitive, so plan output shows (sensitive value) rather than the value.
#
# Prefer `export TF_VAR_session_secret=...` over writing these into a tfvars file.

variable "session_secret" {
  description = "Signs dashboard session cookies. Required — the dashboard will not serve without it."
  type        = string
  sensitive   = true
}

variable "example_secret" {
  description = "Demo secret, mirrors EXAMPLE_SECRET on the SST path."
  type        = string
  sensitive   = true
  default     = ""
}

# OAuth provider credentials — the issuer enables a provider only when its env is present.
variable "github_client_id" {
  description = "GitHub OAuth client id. Empty disables the GitHub provider."
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_client_secret" {
  description = "GitHub OAuth client secret."
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth client id. Empty disables the Google provider."
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret."
  type        = string
  sensitive   = true
  default     = ""
}

variable "auth_providers" {
  description = "Comma list overriding which providers are active; empty means all with credentials."
  type        = string
  sensitive   = true
  default     = ""
}

variable "extra_environment" {
  description = "Additional non-secret environment variables for every worker."
  type        = map(string)
  default     = {}
}

variable "extra_secret_environment" {
  description = "Additional secret environment variables for every worker."
  type        = map(string)
  default     = {}
  sensitive   = true
}

locals {
  # AUTH_URL is composed from the same two pieces the auth worker publishes on.
  # Reading it back off module.auth.url would be a cycle: the auth worker's own
  # bindings contain AUTH_URL.
  auth_url = "https://${var.auth_subdomain}.${module.environment.domain}"

  plain_environment = merge({
    NO_COLOR = local.environment == "prod" ? "1" : ""
    AUTH_URL = local.auth_url
  }, var.extra_environment)

  secret_environment = merge({
    EXAMPLE_SECRET       = var.example_secret
    SESSION_SECRET       = var.session_secret
    GITHUB_CLIENT_ID     = var.github_client_id
    GITHUB_CLIENT_SECRET = var.github_client_secret
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    AUTH_PROVIDERS       = var.auth_providers
  }, var.extra_secret_environment)

  # Shared by every worker, exactly like the `environment` object the SST path
  # spreads into each one. nodejs_compat surfaces both kinds as process.env.
  environment_bindings = concat(
    [for k, v in local.plain_environment : { name = k, type = "plain_text", text = v }],
    [for k, v in local.secret_environment : { name = k, type = "secret_text", text = v }],
  )
}
