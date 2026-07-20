/// <reference path="../../.sst/platform/config.d.ts" />
import { subdomain } from "./stage";

export const EXAMPLE_SECRET = new sst.Secret("EXAMPLE_SECRET", "");

// Signs dashboard session cookies. Set with `sst secret set SESSION_SECRET <value>`.
export const SESSION_SECRET = new sst.Secret("SESSION_SECRET");

// OAuth provider credentials — the issuer enables a provider only when its env is present.
export const GITHUB_CLIENT_ID = new sst.Secret("GITHUB_CLIENT_ID", "");
export const GITHUB_CLIENT_SECRET = new sst.Secret("GITHUB_CLIENT_SECRET", "");
export const GOOGLE_CLIENT_ID = new sst.Secret("GOOGLE_CLIENT_ID", "");
export const GOOGLE_CLIENT_SECRET = new sst.Secret("GOOGLE_CLIENT_SECRET", "");
// Comma list overriding which providers are active; empty = all with credentials.
export const AUTH_PROVIDERS = new sst.Secret("AUTH_PROVIDERS", "");

export const environment = {
  NO_COLOR: $app.stage === "prod" ? "1" : "",
  EXAMPLE_SECRET: EXAMPLE_SECRET.value,
  AUTH_URL: $interpolate`https://${subdomain("auth")}`,
  SESSION_SECRET: SESSION_SECRET.value,
  GITHUB_CLIENT_ID: GITHUB_CLIENT_ID.value,
  GITHUB_CLIENT_SECRET: GITHUB_CLIENT_SECRET.value,
  GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID.value,
  GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET.value,
  AUTH_PROVIDERS: AUTH_PROVIDERS.value,
};
