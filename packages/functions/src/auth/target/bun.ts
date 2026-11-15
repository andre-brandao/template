import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
import { createAuth } from "../index";

const port = Number(process.env.PORT ?? 3002);
console.log(`Auth running at http://localhost:${port}`);

// The issuer holds no app state — no database, queue or mail — so it serves bare.
const app = createAuth(MemoryStorage({ persist: process.env.AUTH_PERSIST }));
export default { port, fetch: (req: Request) => app.fetch(req) };
