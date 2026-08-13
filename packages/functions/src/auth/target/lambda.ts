import { DynamoStorage } from "@openauthjs/openauth/storage/dynamo";
import { Email } from "@template/core/email";
import { lambda } from "../../target";
import { createAuth } from "../index";

// Codes only reach the logs until core grows an SES driver.
export const handler = lambda(
  createAuth(DynamoStorage({ table: process.env.AUTH_TABLE! })),
  Email.provider(Email.fromEnv(process.env)),
);
