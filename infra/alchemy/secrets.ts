import * as Config from "effect/Config";
import { host } from "./stage";

// Read from the deployer's env (or `.env`) at deploy time and bound as `secret_text`.
const optional = (key: string) => Config.String(key).pipe(Config.withDefault(""));

export const environment = (stage: string) => ({
  NO_COLOR: stage === "prod" ? "1" : "",
  AUTH_URL: `https://${host("auth", stage)}`,
  EXAMPLE_SECRET: optional("EXAMPLE_SECRET"),
  SESSION_SECRET: Config.Redacted("SESSION_SECRET"),
  GITHUB_CLIENT_ID: optional("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: optional("GITHUB_CLIENT_SECRET"),
  GOOGLE_CLIENT_ID: optional("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: optional("GOOGLE_CLIENT_SECRET"),
  AUTH_PROVIDERS: optional("AUTH_PROVIDERS"),
});
