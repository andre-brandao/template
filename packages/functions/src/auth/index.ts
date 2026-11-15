import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { issuer } from "@openauthjs/openauth/issuer";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { GoogleProvider } from "@openauthjs/openauth/provider/google";
import { THEME_OPENAUTH } from "@openauthjs/openauth/ui/theme";
import type { StorageAdapter } from "@openauthjs/openauth/storage/storage";
import type { Provider } from "@openauthjs/openauth/provider/provider";
import { subjects } from "./subject";
import { health } from "../health";

/**
 * OAuth only. Password and emailed-code logins are each app's own, straight against its
 * database through `Auth` — so a local stack signs in with no issuer in the path.
 */
const build: Record<string, () => Provider | null> = {
  github: () => {
    const id = process.env.GITHUB_CLIENT_ID;
    const secret = process.env.GITHUB_CLIENT_SECRET;
    if (!id || !secret) return null;
    return GithubProvider({
      clientID: id,
      clientSecret: secret,
      scopes: ["user:email", "read:user"],
    });
  },
  google: () => {
    const id = process.env.GOOGLE_CLIENT_ID;
    const secret = process.env.GOOGLE_CLIENT_SECRET;
    if (!id || !secret) return null;
    // OAuth2 (not OIDC): success() reads the profile with the access token, then drops it.
    return GoogleProvider({
      clientID: id,
      clientSecret: secret,
      scopes: ["openid", "email", "profile"],
    });
  },
};

function providers() {
  const want = (process.env.AUTH_PROVIDERS?.trim() || "github,google")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const out: Record<string, Provider> = {};
  for (const name of want) {
    const p = build[name]?.();
    if (p) out[name] = p;
  }
  // Not fatal: with no OAuth credentials the issuer has nothing to serve, and the dashboard
  // still logs in on its own. Booting anyway keeps `bun dev` whole.
  if (Object.keys(out).length === 0) console.warn("No OAuth providers configured");
  return out;
}

/**
 * Where a code may be sent. Loopback is any port, as native and CLI OAuth clients use it; the
 * rest is first-party hosts plus `AUTH_REDIRECTS`, exact origins like `https://claude.ai`.
 */
function allow(redirect: string) {
  const url = new URL(redirect);
  const host = url.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) return true;
  if (host === "developing.company" || host.endsWith(".developing.company")) return true;
  return (process.env.AUTH_REDIRECTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .includes(url.origin);
}

/** OAuth clients registered here are MCP clients — `Auth.resolve` makes their tokens agents. */
const Registration = z.object({
  redirect_uris: z.array(z.url()).min(1),
  client_name: z.string().optional(),
});

/**
 * Dynamic client registration (RFC 7591), which MCP clients expect. OpenAuth keeps no client
 * registry — any `client_id` passes, and `allow` is the gate — so registering only mints a
 * name: `mcp:<client>`, which is what the agent is called in every event it causes.
 */
async function register(c: Context) {
  const body = Registration.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "invalid_client_metadata" }, 400);
  if (!body.data.redirect_uris.every(allow)) return c.json({ error: "invalid_redirect_uri" }, 400);
  const name =
    (body.data.client_name ?? "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "client";
  return c.json(
    {
      client_id: `mcp:${name}`,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: body.data.client_name,
      redirect_uris: body.data.redirect_uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    201,
  );
}

/**
 * The issuer only says who someone is — `provider:id` and a verified email — and never touches
 * an app's database. Each app links the subject to its own user in `Auth.resolve`, which is
 * what lets one issuer (`id.developing.company`) serve every app built from the template.
 */
export function createAuth(storage: StorageAdapter) {
  const app = issuer({
    subjects,
    storage,
    theme: THEME_OPENAUTH,
    ttl: { access: 60 * 30 },
    providers: providers(),
    allow: async (input) => !!process.env.SST_DEV || allow(input.redirectURI),
    success: async (ctx, response) => {
      if (response.provider === "github") {
        const headers = {
          Authorization: `Bearer ${response.tokenset.access}`,
          "User-Agent": "template",
          Accept: "application/vnd.github+json",
        };
        const [profile, emails] = await Promise.all([
          fetch("https://api.github.com/user", { headers }).then(
            (r) => r.json() as Promise<{ id: number; name?: string; login: string }>,
          ),
          fetch("https://api.github.com/user/emails", { headers }).then(
            (r) => r.json() as Promise<{ email: string; primary: boolean; verified: boolean }[]>,
          ),
        ]);
        const primary = emails.find((e) => e.primary);
        if (!primary) throw new Error("No primary email found for GitHub user");
        if (!primary.verified) throw new Error("Primary email for GitHub user not verified");
        return ctx.subject("identity", {
          id: `github:${profile.id}`,
          provider: "github",
          email: primary.email,
          name: profile.name ?? profile.login,
        });
      }

      if (response.provider === "google") {
        const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
          headers: { Authorization: `Bearer ${response.tokenset.access}` },
        }).then(
          (r) =>
            r.json() as Promise<{
              sub: string;
              email: string;
              email_verified?: boolean;
              name?: string;
            }>,
        );
        if (!info.email_verified) throw new Error("Google email not verified");
        return ctx.subject("identity", {
          id: `google:${info.sub}`,
          provider: "google",
          email: info.email,
          name: info.name,
        });
      }

      throw new Error("Unsupported provider");
    },
  });

  const open = cors({ origin: "*", allowHeaders: ["*"], allowMethods: ["GET", "POST"] });

  // Mounted ahead of the issuer so they win: OpenAuth's own metadata omits registration and
  // PKCE, which MCP clients read before they start. Its base fields are reused as-is.
  return new Hono()
    .route("/", health)
    .get("/.well-known/oauth-authorization-server", open, async (c) => {
      const base = (await (await app.fetch(c.req.raw)).json()) as { issuer: string };
      return c.json({
        ...base,
        registration_endpoint: `${base.issuer}/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none"],
      });
    })
    .post("/register", open, register)
    .route("/", app);
}
