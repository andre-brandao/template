import { issuer } from "@openauthjs/openauth/issuer";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { CodeUI } from "@openauthjs/openauth/ui/code";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { GoogleProvider } from "@openauthjs/openauth/provider/google";
import { THEME_OPENAUTH } from "@openauthjs/openauth/ui/theme";
import type { StorageAdapter } from "@openauthjs/openauth/storage/storage";
import type { Provider } from "@openauthjs/openauth/provider/provider";
import { Password } from "@template/core/util/password";
import { Template } from "@template/core/email/template";
import { Auth } from "@template/core/user/auth";
import { subjects } from "./subject";

const hasher = { hash: Password.hash, verify: Password.verify };

/** Providers keyed by name; each returns `null` when its credentials are absent. */
const build: Record<string, () => Provider | null> = {
  password: () => PasswordProvider({ ...PasswordUI({ sendCode: Template.sendLoginCode }), hasher }),
  code: () =>
    CodeProvider(
      CodeUI({ sendCode: (claims, code) => Template.sendLoginCode(claims.email!, code) }),
    ),
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
    // OAuth2 (not OIDC) so success() gets a tokenset to persist for calling Google as the user.
    return GoogleProvider({
      clientID: id,
      clientSecret: secret,
      scopes: ["openid", "email", "profile"],
    });
  },
};

function providers() {
  const want = (process.env.AUTH_PROVIDERS ?? "password,code,github,google")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const out: Record<string, Provider> = {};
  for (const name of want) {
    const p = build[name]?.();
    if (p) out[name] = p;
  }
  if (Object.keys(out).length === 0) throw new Error("No auth providers configured");
  return out;
}

function allow(redirect: string) {
  const host = new URL(redirect).hostname;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith("developing.company")) return true;
  return false;
}

/** OpenAuth's OAuth2 tokenset (`expiry` is seconds-until-expiry) → storable tokens. */
function mint(set: { access: string; refresh: string; expiry: number }): Auth.Tokens {
  return {
    access: set.access,
    refresh: set.refresh || null,
    expiresAt: set.expiry ? new Date(Date.now() + set.expiry * 1000) : null,
  };
}

export function createAuth(storage: StorageAdapter) {
  return issuer({
    subjects,
    storage,
    theme: THEME_OPENAUTH,
    ttl: { access: 60 * 30 },
    providers: providers(),
    allow: async (input) => !!process.env.SST_DEV || allow(input.redirectURI),
    success: async (ctx, response) => {
      if (response.provider === "password") {
        const email = response.email;
        const userID = await Auth.provision({ provider: "email", accountId: email, email });
        return ctx.subject("user", { userID, email });
      }

      if (response.provider === "code") {
        const email = response.claims.email!;
        const userID = await Auth.provision({ provider: "email", accountId: email, email });
        return ctx.subject("user", { userID, email });
      }

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
        const userID = await Auth.provision({
          provider: "github",
          accountId: String(profile.id),
          email: primary.email,
          name: profile.name ?? profile.login,
          tokens: mint(response.tokenset),
        });
        return ctx.subject("user", { userID, email: primary.email });
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
        const userID = await Auth.provision({
          provider: "google",
          accountId: info.sub,
          email: info.email,
          name: info.name,
          tokens: mint(response.tokenset),
        });
        return ctx.subject("user", { userID, email: info.email });
      }

      throw new Error("Unsupported provider");
    },
  });
}
