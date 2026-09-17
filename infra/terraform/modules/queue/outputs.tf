# modules/queue/outputs.tf

output "queue_id" {
  description = "Queue id, for the consumer binding."
  value       = cloudflare_queue.this.queue_id
}

output "queue_name" {
  description = "Queue name, for producer bindings."
  value       = cloudflare_queue.this.queue_name
}

output "dlq_id" {
  description = "Dead letter queue id."
  value       = cloudflare_queue.dlq.queue_id
}

output "dlq_name" {
  description = "Dead letter queue name, for the consumer's dead_letter_queue setting."
  value       = cloudflare_queue.dlq.queue_name
}
