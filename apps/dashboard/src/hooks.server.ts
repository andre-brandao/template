import { sequence } from "@sveltejs/kit/hooks";
import { redirect } from "@sveltejs/kit";
import type { Handle, HandleServerError, RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { Database } from "@template/core/drizzle";
import { File } from "@template/core/file";
import { createR2Storage } from "@template/core/file/adapter/r2";
import { Actor } from "@template/core/actor";
import { VisibleError } from "@template/core/error";
import { Log } from "@template/core/util/log";
import { dev } from "$app/environment";
import { org, read, remember } from "$lib/server/session";
import { Member } from "@template/core/organization/member";

const log = Log.create({ namespace: "dashboard.hooks.server" });

const handleDb: Handle = ({ event, resolve }) => {
  // On Cloudflare the Hyperdrive binding exposes a pooled connection string at runtime;
  // fall back to DATABASE_URL for local/node dev where the binding is absent.
  const url =
    event.platform?.env?.Hyperdrive?.connectionString ?? env.DATABASE_URL ?? Database.DEFAULT_URL;

  return Promise.resolve(Database.provide(url, () => resolve(event))).finally(() =>
    dev ? Database.release(url) : undefined,
  );
};

const handleStorage: Handle = ({ event, resolve }) => {
  if (event.platform?.env?.Files) {
    return File.provide(createR2Storage(event.platform.env.Files), () => resolve(event));
  }

  return File.provide(File.fromEnv(env), () => resolve(event));
};

// The org named by the request's Referer — the calling page's URL names the
// org that tab is looking at, beating the shared cookie in multi-tab sessions.
function referer(event: RequestEvent) {
  const raw = event.request.headers.get("referer");
  if (!raw || !URL.canParse(raw)) return undefined;
  const [seg] = new URL(raw).pathname.split("/").filter(Boolean);
  return seg?.startsWith("org_") ? seg : undefined;
}

// The `[orgId]` URL segment names the active org for page requests. Remote
// function calls carry no param — the Referer names the org instead. Membership
// is verified either way, so a forged value is harmless.
async function membership(event: RequestEvent, userID: string) {
  const param = event.params.orgId;
  const member = await Member.resolve({
    userID,
    orgID: param ?? referer(event) ?? org(event),
  });
  if (param && member?.orgID !== param) redirect(303, "/");
  // The cookie follows page navigations only — background-tab remote calls
  // must not steal the preference.
  if (param && member && org(event) !== member.orgID) remember(event, member.orgID);
  return member;
}

const handleAuth: Handle = async ({ event, resolve }) => {
  // Health probes don't need an actor; skip it so they don't spam logs.
  if (event.url.pathname === "/healthz") return resolve(event);

  const session = await read(event);
  event.locals.session = session;
  if (!session) return Actor.provide("public", {}, () => resolve(event));

  const member = await membership(event, session.userID);
  return Actor.provide(
    "user",
    { userID: session.userID, orgID: member?.orgID, permissions: member?.permissions },
    () => resolve(event),
  );
};

export const handle = sequence(handleDb, handleStorage, handleAuth);

export const handleError: HandleServerError = ({ error, event, status, message }) => {
  if (status === 404) return { message: "Not found" };

  const path = event.url.pathname;
  log.info(`Error occurred during request to ${path}: ${message}`, { status, message });

  if (error instanceof VisibleError) {
    log.warn(error.message, { status, code: error.code, path });
    return { message: error.message, code: error.code };
  }

  const detail = error instanceof Error ? error.message : String(error);
  log.warn(error instanceof Error ? "unhandled error instance" : "unhandled error type", {
    status,
    message: detail,
    path,
  });
  return { message: dev ? detail : "An unexpected error occurred." };
};
