import { createClient } from "@template/sdk/client";
import { TemplateSdk } from "@template/sdk";
import { strip, value } from "./args";
import * as config from "./config";

/** A configured SDK instance pointed at `url` with an optional bearer `token`. */
export function sdk(token?: string, url = "http://localhost:3000") {
  const client = createClient({
    baseUrl: url,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  return new TemplateSdk({ client });
}

/** Callable method names, reflected off the SDK so they track the generated client. */
export function methods() {
  const proto = TemplateSdk.prototype as unknown as Record<string, unknown>;
  return Object.getOwnPropertyNames(proto)
    .filter((n) => n !== "constructor" && typeof proto[n] === "function")
    .sort();
}

/** Coerce a flag string into number/boolean/string. */
function coerce(v: string) {
  if (v === "true") return true;
  if (v === "false") return false;
  const n = Number(v);
  return v !== "" && !Number.isNaN(n) ? n : v;
}

/** Turn `["--title", "hi", "--done"]` into `{ title: "hi", done: true }`. Also accepts a `{json}` blob. */
export function params(args: string[]) {
  if (args[0]?.startsWith("{")) return JSON.parse(args[0]) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq >= 0) {
      out[a.slice(2, eq)] = coerce(a.slice(eq + 1));
      continue;
    }
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) {
      out[a.slice(2)] = true;
      continue;
    }
    out[a.slice(2)] = coerce(next);
    i++;
  }
  return out;
}

export async function api(rest: string[]) {
  const method = rest[0];
  if (!method || method === "help") {
    console.log(`Usage: template-cli api <method> [--key value | '{json}']\n`);
    console.log("Methods:");
    for (const m of methods()) console.log(`  ${m}`);
    return;
  }

  if (!methods().includes(method)) {
    console.error(`Unknown method: ${method}. Run "template-cli api" to list methods.`);
    process.exit(1);
  }

  // `--token`/`--url` configure the client; everything else becomes the call params.
  const raw = rest.slice(1);
  const client = sdk(
    await config.token(value(raw, "--token")),
    await config.url(value(raw, "--url")),
  );
  // Invoke as a member so `this` binds to the client instance.
  const call = client as unknown as Record<string, (p: unknown) => Promise<Result>>;
  const res = await call[method]!(params(strip(raw, ["--token", "--url"])));
  output(res);
}

type Result = { data?: unknown; error?: unknown };

/** Print `res.data` as JSON, or print the error and exit non-zero. */
export function output(res: Result) {
  if (res.error) {
    console.error(JSON.stringify(res.error, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(res.data, null, 2));
}
