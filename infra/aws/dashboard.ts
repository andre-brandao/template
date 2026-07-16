import { database } from "./database"
import { environment } from "./secrets"
import { domain } from "./stage"

const dashboard = new sst.aws.SvelteKit("Dashboard", {
  path: "apps/dashboard",
  domain,
  link: [database],
  environment: {
    ...environment,
    SVELTE_ADAPTER: "sst-aws",
    DATABASE_URL: $interpolate`postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}?sslmode=require`,
  },
})

export const outputs = {
  dashboard: dashboard.url,
}
