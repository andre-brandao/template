import { DynamoStorage } from "@openauthjs/openauth/storage/dynamo";
import { Email } from "@template/core/email";
import { createConsoleSender } from "@template/core/email/adapter/console";
import { lambda } from "../../target";
import { createAuth } from "../index";

// Codes only reach the logs until core grows an SES adapter.
export const handler = lambda(
  createAuth(DynamoStorage({ table: process.env.AUTH_TABLE! })),
  Email.provider(createConsoleSender()),
);
