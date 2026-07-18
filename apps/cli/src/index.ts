#!/usr/bin/env bun

import { api } from "./api";
import { login, logout, whoami } from "./auth";
import { serve } from "./serve";

const help = `template-cli — run and talk to the template

Usage:
  template-cli serve <api|mcp|auth|dashboard>  Serve a surface
  template-cli api [method] [args]             Call the API via the built-in SDK
  template-cli login [--issuer --url]          Log in via browser (PKCE) and save tokens
  template-cli logout                          Forget the saved tokens
  template-cli whoami                          Show the current user

Env: API_URL, AUTH_URL, TEMPLATE_TOKEN, PORT, MCP_PORT, DATABASE_URL, AUTH_PERSIST
Note: "serve api", "serve mcp" and "serve auth" need a reachable DATABASE_URL (use "bun dev" for local pglite).`;

const commands: Record<string, (rest: string[]) => unknown> = {
  serve,
  api,
  login,
  logout,
  whoami,
};

const [cmd, ...rest] = process.argv.slice(2);
const run = commands[cmd ?? ""];
if (!run) {
  console.log(help);
  process.exit(cmd ? 1 : 0);
}
await run(rest);
