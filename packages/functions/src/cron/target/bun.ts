import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { createConsoleSender } from "@template/core/email/adapter/console";
import { weekly } from "../index";

const url = process.env.DATABASE_URL ?? Database.DEFAULT_URL;
await Context.withProviders(weekly, Database.provider(url), Email.provider(createConsoleSender()));
await Database.release(url);
