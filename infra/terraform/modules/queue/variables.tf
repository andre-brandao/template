# modules/queue/variables.tf

variable "account_id" {
  description = "Cloudflare account ID."
  type        = string
}

variable "name" {
  description = "Queue name. Queue names are account-global, so keep the project + environment prefix."
  type        = string
}

variable "dlq_name" {
  description = "Dead letter queue name. Also account-global."
  type        = string
}
