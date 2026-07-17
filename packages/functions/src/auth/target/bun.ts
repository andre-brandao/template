import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
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
      return await Database.provide(url, () => Email.provide(sender, () => app.fetch(req)));
    } finally {
      await Database.release(url);
    }
  },
});

console.log("Server started auth");
