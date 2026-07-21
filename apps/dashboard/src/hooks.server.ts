import { sequence } from "@sveltejs/kit/hooks";
import { redirect } from "@sveltejs/kit";
import type { Handle, HandleServerError } from "@sveltejs/kit";
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

const handleAuth: Handle = async ({ event, resolve }) => {
  // Health probes don't need an actor; skip it so they don't spam logs.
  if (event.url.pathname === "/healthz") return resolve(event);

  const session = await read(event);
  event.locals.session = session;
  if (!session) return Actor.provide("public", {}, () => resolve(event));

  // The `[orgId]` URL segment names the active org for page requests. Remote
  // function calls carry no param — the calling page's URL in the Referer names
  // the org that tab is looking at, beating the shared cookie in multi-tab
  // sessions. Membership is verified either way, so a forged value is harmless.
  const param = event.params.orgId;
  const referer = (() => {
    const raw = event.request.headers.get("referer");
    if (!raw || !URL.canParse(raw)) return undefined;
    const [seg] = new URL(raw).pathname.split("/").filter(Boolean);
    return seg?.startsWith("org_") ? seg : undefined;
  })();
  const membership = await Member.resolve({
    userID: session.userID,
    orgID: param ?? referer ?? org(event),
  });
  if (param && membership?.orgID !== param) redirect(303, "/");
  // The cookie follows page navigations only — background-tab remote calls
  // must not steal the preference.
  if (param && membership && org(event) !== membership.orgID) remember(event, membership.orgID);

  return Actor.provide(
    "user",
    { userID: session.userID, orgID: membership?.orgID, permissions: membership?.permissions },
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
