import { handle } from "hono/aws-lambda";
import { DynamoStorage } from "@openauthjs/openauth/storage/dynamo";
import { createAuth } from "../index";

// Stateless toward apps: the issuer's own storage is all it needs.
export const handler = handle(createAuth(DynamoStorage({ table: process.env.AUTH_TABLE! })));
