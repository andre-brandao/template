import { app } from "../routes";

const port = parseInt(process.env.PORT!) || 3000;
console.log(`Running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
