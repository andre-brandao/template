import { strip, value } from "./args";

/** The ports `serve` binds, read from the same env vars, so a probe can't drift from its server. */
const ports = {
  api: () => process.env.API_PORT ?? 3000,
  mcp: () => process.env.MCP_PORT ?? 3001,
  auth: () => process.env.PORT ?? 3002,
  dashboard: () => process.env.PORT ?? 3000,
};

const paths = { live: "/healthz", ready: "/readyz", start: "/startupz" };

/**
 * The exit code is the answer — 0 healthy, 1 not — so this drops straight into a Docker
 * `healthcheck` or a Kubernetes exec probe. The body is printed either way: Docker keeps it
 * in `docker inspect` → `State.Health.Log`, which is where a 503's cause ends up.
 */
export async function health(rest: string[]) {
  const path = paths[(value(rest, "--probe") ?? "ready") as keyof typeof paths];
  const target = strip(rest, ["--probe", "--url"])[0];
  const port = ports[target as keyof typeof ports]?.();
  const base = value(rest, "--url") ?? (port ? `http://localhost:${port}` : undefined);
  if (!path || !base) {
    console.error(
      `Usage: template-cli health <${Object.keys(ports).join("|")}> [--probe live|ready|start] [--url <base>]`,
    );
    process.exit(1);
  }

  const res = await fetch(base + path, { signal: AbortSignal.timeout(5000) }).catch(() => null);
  console.log(res ? await res.text() : `${base}${path} unreachable`);
  process.exit(res?.ok ? 0 : 1);
}
