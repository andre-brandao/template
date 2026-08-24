import { Database } from "../../drizzle";

const boot = Date.now();
let started = false;

function uptime() {
  return Math.round((Date.now() - boot) / 1000);
}

/**
 * The three probes, one meaning each. `live` touches no dependency — a database outage
 * must not get the process restarted. `ready` gates traffic. `start` latches on the first
 * successful check, so a dependency lost later fails readiness rather than boot.
 */
export namespace Health {
  export function live() {
    return { status: "ok" as const, uptime: uptime() };
  }

  export async function ready() {
    const db = await Database.healthcheck();
    started ||= db.status === "ok";
    return { status: db.status, uptime: uptime(), checks: { db } };
  }

  export async function start() {
    if (started) return { status: "ok" as const, uptime: uptime() };
    const check = await ready();
    if (check.status === "ok") return { status: "ok" as const, uptime: uptime() };
    return { ...check, status: "starting" as const };
  }

  /** 503 keeps a probe failure out of the 2xx range without dressing it as an app error. */
  export function code(probe: { status: string }) {
    return probe.status === "ok" ? 200 : 503;
  }
}
