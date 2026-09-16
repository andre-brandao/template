# envs/aws — stub

Not wired up. It exists so the Lambda target has an obvious home, and so the
Cloudflare root is visibly one of several rather than the only shape.

`packages/functions/src/*/target/lambda.ts` already exists for api, mcp and auth
(the queue consumer has no lambda target). What is missing here is a
`modules/lambda` — bundle, zip through a *managed* `archive_file` resource, then
`aws_lambda_function` + role + log group + function URL. See
`/home/andre/Projects/DEVELOPING/hono-terraform/infra/terraform/modules/hono-lambda`
for a working version of exactly that; it needs generalizing the same way
`modules/worker` was — the build hoisted out, entrypoint per service.

The harder half is not the compute. `infra/sst/aws` reaches for a VPC, RDS and a
Dynamo table for auth storage, none of which the Cloudflare path needs, and the
`Files`/`Jobs` bindings have to become S3 and SQS behind the same
`packages/core` ports.

```bash
cd infra/terraform/envs/aws
tofu init && tofu apply
```

does nothing useful yet — `main.tf` declares no resources on purpose.
