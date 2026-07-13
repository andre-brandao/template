import { rm } from "node:fs/promises";

export type Config = { token?: string; url?: string };

const dir = `${process.env.XDG_CONFIG_HOME ?? `${process.env.HOME}/.config`}/template`;
const file = `${dir}/config.json`;

// fallow-ignore-next-line unused-export
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

/** Bearer token: `--token` flag › `TEMPLATE_TOKEN` env › saved config. */
export async function token(flag?: string) {
  return flag ?? process.env.TEMPLATE_TOKEN ?? (await read()).token;
}

/** Base URL: `--url` flag › `API_URL` env › saved config › localhost. */
export async function url(flag?: string) {
  return flag ?? process.env.API_URL ?? (await read()).url ?? "http://localhost:3000";
}
