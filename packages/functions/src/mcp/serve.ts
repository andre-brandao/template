import { app } from "./index";

const port = parseInt(process.env.MCP_PORT!) || 3001;
console.log(`MCP running at http://localhost:${port}/mcp`);

export default {
  port,
  fetch: app.fetch,
};
