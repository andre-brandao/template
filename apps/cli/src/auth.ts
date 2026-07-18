import { createClient } from "@openauthjs/openauth/client";
import { sdk, output } from "./api";
import { value } from "./args";
import * as config from "./config";

const PORT = 3006;
const CALLBACK = `http://localhost:${PORT}/callback`;

async function browse(url: string) {
  const opener =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  await Bun.$`${opener} ${url}`.quiet().nothrow();
}

function page(ok: boolean, message: string) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>${ok ? "Logged in" : "Login failed"}</title>` +
      `<body style="font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0">` +
      `<p>${message} You can close this tab.</p></body>`,
    { headers: { "Content-Type": "text/html" } },
  );
}

/** Browser PKCE flow: open the issuer, catch the redirect on a loopback server, exchange the code. */
export async function login(rest: string[]) {
  const issuer = await config.issuer(value(rest, "--issuer"));
  const url = await config.url(value(rest, "--url"));
  const auth = createClient({ clientID: "cli", issuer });

  const { challenge, url: authUrl } = await auth.authorize(CALLBACK, "code", { pkce: true });
  console.log("Opening browser to authenticate...");
  console.log(authUrl);
  await browse(authUrl);

  const code = await new Promise<string>((resolve, reject) => {
    const server = Bun.serve({
      port: PORT,
      fetch(req) {
        const u = new URL(req.url);
        if (u.pathname !== "/callback") return new Response("Not found", { status: 404 });
        const code = u.searchParams.get("code");
        const err = u.searchParams.get("error");
        setTimeout(() => server.stop(), 1000);
        if (code) {
          resolve(code);
          return page(true, "Login successful.");
        }
        reject(new Error(u.searchParams.get("error_description") ?? err ?? "No code received"));
        return page(false, "Authentication failed.");
      },
    });
    setTimeout(() => {
      server.stop();
      reject(new Error("Login timed out after 2 minutes"));
    }, 120_000);
  });

  const exchanged = await auth.exchange(code, CALLBACK, challenge.verifier);
  if (exchanged.err) {
    console.error("Failed to exchange authorization code");
    process.exit(1);
  }

  await config.write({
    access: exchanged.tokens.access,
    refresh: exchanged.tokens.refresh,
    issuer,
    url,
  });
  console.log("Logged in successfully!");
  process.exit(0);
}

export async function logout() {
  await config.clear();
  console.log("Logged out");
}

export async function whoami() {
  const res = await sdk(await config.token(), await config.url()).getMe();
  output(res);
}
