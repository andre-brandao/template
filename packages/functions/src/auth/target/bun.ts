import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { createConsoleSender } from "@template/core/email/adapter/console";
import { createAuth } from "../index";

const url = process.env.DATABASE_URL ?? Database.DEFAULT_URL;
const app = createAuth(MemoryStorage({ persist: process.env.AUTH_PERSIST }));
const sender = createConsoleSender();

Bun.serve({
  port: Number(process.env.PORT ?? 3002),
  // Release the DB connection after each request — pglite allows only one, and the
  // dashboard needs it back the moment login redirects there.
  fetch: async (req) => {
    try {
      return await Context.withProviders(
        () => app.fetch(req),
        Database.provider(url),
        Email.provider(sender),
      );
    } finally {
      await Database.release(url);
    }
  },
});

console.log("Server started auth");
