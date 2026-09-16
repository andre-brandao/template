# envs/aws/variables.tf

variable "project" {
  description = "Name prefix for created resources."
  type        = string
  default     = "template-tf"
}

variable "default_environment" {
  description = "Environment to assume when running in the unnamed default workspace."
  type        = string
  default     = "dev"
}

variable "base_domain" {
  description = "Root the environment domains hang off. Unused while this stub declares no resources, but keeps both stacks on one naming scheme."
  type        = string
  default     = "tf.template.developing.company"
}

variable "aws_region" {
  description = "AWS region. Leave null to let the provider resolve it the normal way (AWS_REGION, AWS_DEFAULT_REGION, or the active profile)."
  type        = string
  default     = null
}

variable "build" {
  description = "Bundle the app during apply. Set false in CI when the artifacts already exist."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Extra tags merged into the AWS default tags."
  type        = map(string)
  default     = {}
}
