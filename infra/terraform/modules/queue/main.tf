# modules/queue/main.tf
#
# The jobs queue and its dead letter queue. infra/sst/cf/queue.ts passes the DLQ
# as a bare name and lets Cloudflare create it on first use; Terraform has to own
# it, so it is a real resource here.
#
# The consumer binding lives at the root module: it needs both a queue and a
# script, and neither module should have to know about the other.

resource "cloudflare_queue" "this" {
  account_id = var.account_id
  queue_name = var.name
}

resource "cloudflare_queue" "dlq" {
  account_id = var.account_id
  queue_name = var.dlq_name
}
