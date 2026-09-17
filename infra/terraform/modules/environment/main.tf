# modules/environment/main.tf
#
# Environment -> domain. That is the whole job: consumers build their own
# hostnames on top of `domain`, so adding a service never touches this module.
#
#   prod    ->             tf.template.developing.company
#   dev     ->         dev.tf.template.developing.company
#   pr-123  ->  pr-123.dev.tf.template.developing.company

terraform {
  required_version = ">= 1.4"
}

locals {
  is_permanent = contains(var.permanent_environments, var.environment)

  domain = (
    var.environment == "prod" ? var.base_domain :
    var.environment == "dev" ? "dev.${var.base_domain}" :
    "${var.environment}.dev.${var.base_domain}"
  )
}
