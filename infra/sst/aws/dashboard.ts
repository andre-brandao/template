import { database, url } from "./database"
import { environment } from "./secrets"
import { domain } from "./stage"

const dashboard = new sst.aws.SvelteKit("Dashboard", {
  path: "apps/dashboard",
  domain,
  link: [database],
  environment: {
    ...environment,
    SVELTE_ADAPTER: "sst-aws",
    DATABASE_URL: url,
  },
})

export const outputs = {
  dashboard: dashboard.url,
}
