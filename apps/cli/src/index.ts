#!/usr/bin/env bun

import { api } from "./api";
import { login, logout, whoami } from "./auth";
import { serve } from "./serve";

const help = `template-cli — run and talk to the template

Usage:
  template-cli serve <api|mcp|dashboard>   Serve a surface
  template-cli api [method] [args]         Call the API via the built-in SDK
  template-cli login [--email --password]  Log in and save a token
  template-cli logout                      Forget the saved token
  template-cli whoami                      Show the current user

Env: API_URL, TEMPLATE_TOKEN, PORT, MCP_PORT, DATABASE_URL
Note: "serve api" and "serve mcp" need a reachable DATABASE_URL (use "bun dev" for local pglite).`;

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
