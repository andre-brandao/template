import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
import { Email } from "@template/core/email";
import { bun } from "../../target";
import { createAuth } from "../index";

const port = Number(process.env.PORT ?? 3002);
console.log(`Auth running at http://localhost:${port}`);

export default bun(
  createAuth(MemoryStorage({ persist: process.env.AUTH_PERSIST })),
  port,
  Email.provider(Email.fromEnv(process.env)),
);
