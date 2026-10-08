import { secrets } from "../shared";
import { host } from "./stage";

// Bound as `secret_text`.
export const environment = (stage: string) => ({
  NO_COLOR: stage === "prod" ? "1" : "",
  AUTH_URL: `https://${host("auth", stage)}`,
  ...secrets,
});
