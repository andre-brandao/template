import { sdk, output } from "./api";
import { value } from "./args";
import * as config from "./config";

/** Read `--flag value`, else prompt. Exits if neither yields a value. */
function need(args: string[], flag: string, ask: string) {
  const answer = value(args, flag) ?? prompt(ask);
  if (!answer) {
    console.error(`${flag} is required`);
    process.exit(1);
  }
  return answer;
}

/** Note: the password prompt echoes — Bun has no built-in hidden input. Prefer `--password`. */
export async function login(rest: string[]) {
  const email = need(rest, "--email", "Email:");
  const password = need(rest, "--password", "Password:");
  const url = await config.url(value(rest, "--url"));
  const res = await sdk(undefined, url).postAuthLogin({ email, password });
  if (res.error || !res.data) {
    console.error(JSON.stringify(res.error, null, 2));
    process.exit(1);
  }
  await config.write({ token: res.data.token, url });
  console.log(`Logged in as ${res.data.userID}`);
}

export async function logout() {
  const token = await config.token();
  if (token) await sdk(token, await config.url()).postAuthLogout();
  await config.clear();
  console.log("Logged out");
}

export async function whoami() {
  const res = await sdk(await config.token(), await config.url()).getMe();
  output(res);
}
