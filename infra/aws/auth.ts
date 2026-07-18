import { database, url } from "./database"
import { environment } from "./secrets"
import { vpc } from "./vpc"

// OpenAuth's DynamoStorage defaults: pk/sk keys, "expiry" ttl attribute.
const table = new sst.aws.Dynamo("AuthTable", {
  fields: { pk: "string", sk: "string" },
  primaryIndex: { hashKey: "pk", rangeKey: "sk" },
  ttl: "expiry",
})

const auth = new sst.aws.Function("Auth", {
  vpc,
  handler: "packages/functions/src/auth/target/lambda.handler",
  url: true,
  streaming: true,
  link: [database, table],
  environment: {
    ...environment,
    DATABASE_URL: url,
    AUTH_TABLE: table.name,
  },
})

export const outputs = {
  auth: auth.url,
}
