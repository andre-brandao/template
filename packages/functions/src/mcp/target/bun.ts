import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { app } from "../index";

const url = process.env.DATABASE_URL ?? Database.DEFAULT_URL;
const port = parseInt(process.env.MCP_PORT!) || 3001;
console.log(`MCP running at http://localhost:${port}/mcp`);

export default {
  port,
  // Release the DB connection after each request — pglite allows only one, and other
  // dev processes (dashboard, auth) need it back between requests.
  fetch: async (req: Request) => {
    try {
      return await Context.withProviders(() => app.fetch(req), Database.provider(url));
    } finally {
      await Database.release(url);
    }
  },
};
