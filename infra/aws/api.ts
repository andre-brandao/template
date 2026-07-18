import { database, url } from "./database"
import { environment } from "./secrets"
import { vpc } from "./vpc"

const api = new sst.aws.Function("Api", {
  vpc,
  handler: "packages/functions/src/api/target/lambda.handler",
  url: true,
  streaming: true,
  link: [database],
  environment: {
    ...environment,
    DATABASE_URL: url,
  },
})

export const outputs = {
  api: api.url,
}
