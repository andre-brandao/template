import { database, url } from "./database"
import { environment } from "./secrets"
import { vpc } from "./vpc"

const mcp = new sst.aws.Function("Mcp", {
  vpc,
  handler: "packages/functions/src/mcp/target/lambda.handler",
  url: true,
  streaming: true,
  link: [database],
  environment: {
    ...environment,
    DATABASE_URL: url,
  },
})

export const outputs = {
  mcp: mcp.url,
}
