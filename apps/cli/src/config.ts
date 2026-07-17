import { rm } from "node:fs/promises";
import { createClient } from "@openauthjs/openauth/client";

export type Config = {
  /** A manually-pasted `sk-` API key. */
  token?: string;
  /** OAuth tokens from `login`. */
  access?: string;
  refresh?: string;
  issuer?: string;
  url?: string;
};

const dir = `${process.env.XDG_CONFIG_HOME ?? `${process.env.HOME}/.config`}/template`;
const file = `${dir}/config.json`;

export async function read(): Promise<Config> {
  const f = Bun.file(file);
  if (await f.exists()) return f.json();
  return {};
}

export async function write(cfg: Config) {
  await Bun.write(file, JSON.stringify(cfg, null, 2));
}

export async function clear() {
  if (await Bun.file(file).exists()) await rm(file);
}

/**
 * Bearer for API calls: `--token` flag › `TEMPLATE_TOKEN` env › a pasted `sk-` key
 * › the saved OAuth access token, refreshed if a refresh token is on file.
 */
export async function token(flag?: string) {
  if (flag) return flag;
  if (process.env.TEMPLATE_TOKEN) return process.env.TEMPLATE_TOKEN;

  const cfg = await read();
  if (cfg.token) return cfg.token;
  if (!cfg.access) return undefined;
  if (!cfg.refresh || !cfg.issuer) return cfg.access;

  const next = await createClient({ clientID: "cli", issuer: cfg.issuer }).refresh(cfg.refresh, {
    access: cfg.access,
  });
  if (next.err || !next.tokens) return cfg.access;
  await write({ ...cfg, access: next.tokens.access, refresh: next.tokens.refresh });
  return next.tokens.access;
}

/** Base URL: `--url` flag › `API_URL` env › saved config › localhost. */
export async function url(flag?: string) {
  return flag ?? process.env.API_URL ?? (await read()).url ?? "http://localhost:3000";
}

/** Issuer URL: `--issuer` flag › `AUTH_URL` env › saved config › localhost. */
export async function issuer(flag?: string) {
  return flag ?? process.env.AUTH_URL ?? (await read()).issuer ?? "http://localhost:3002";
}
