import * as Alchemy from "alchemy";
import * as Command from "alchemy/Command";
import * as Docker from "alchemy/Docker";
import * as Output from "alchemy/Output";
import * as State from "alchemy/State";
import path from "node:path";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import { root, secrets } from "../shared";

// infra/docker/compose.yml as an Alchemy stack, off the same Dockerfile. Host ports are
// compose's + 10000 so both can run at once. State is local: it only drives this machine's daemon.
export default Alchemy.Stack(
  "template-alc-docker",
  {
    providers: Layer.mergeAll(Docker.providers(), Command.providers()),
    state: State.localState(),
  },
  Effect.gen(function* () {
    const build = (target: string) => ({
      build: { context: root, dockerfile: "infra/docker/Dockerfile", target },
    });
    const app = yield* Docker.Image("App", build("runtime"));
    const migrator = yield* Docker.Image("Migrator", build("migrate"));
    const net = yield* Docker.Network("Net", {});
    const pgdata = yield* Docker.Volume("Pgdata", {});
    const files = yield* Docker.Volume("Files", {});
    const authdata = yield* Docker.Volume("Authdata", {});

    const password = yield* Config.Redacted("POSTGRES_PASSWORD").pipe(
      Config.withDefault(Redacted.make("password")),
    );
    const pg = yield* Docker.Container("Postgres", {
      image: "postgres:17",
      environment: { POSTGRES_PASSWORD: password },
      ports: [{ external: 15432, internal: 5432 }],
      volumes: [{ hostPath: pgdata.name, containerPath: "/var/lib/postgresql/data" }],
      networks: [{ name: net.name, aliases: ["postgres"] }],
      restart: "unless-stopped",
      start: true,
    });

    const url = Redacted.make(
      `postgresql://postgres:${Redacted.value(password)}@postgres:5432/postgres`,
    );

    // Containers start without waiting on health, so this polls Postgres itself. drizzle-kit
    // reports failures on stdout, but alchemy's CommandError only carries stderr.
    const migration = yield* Command.Exec("Migrate", {
      command: Output.interpolate`until docker exec ${pg.name} pg_isready -q -U postgres; do sleep 1; done; docker run --rm --network ${net.name} -e DATABASE_URL ${migrator.imageRef} 1>&2`,
      shell: true,
      cwd: path.join(root, "packages/core"),
      env: { DATABASE_URL: url },
      memo: { include: ["migrations/**/*.sql"] },
      timeout: "2 minutes",
    });

    // What compose's `.env` held, minus the per-service ports.
    const env = {
      ...(yield* Config.all(secrets)),
      DATABASE_URL: url,
      NODE_ENV: "production",
      ORIGIN: "http://localhost:13000",
      BODY_SIZE_LIMIT: "10485760",
      STORAGE_DISK: "fs",
      STORAGE_DIR: "/data/files",
      STORAGE_URL: "http://localhost:13000/file/signed",
      QUEUE_DRIVER: "sync",
      AUTH_URL: "http://auth:3002",
    };

    const filedata = { hostPath: files.name, containerPath: "/data/files" };
    const serve = (
      id: string,
      name: string,
      port: { external: number; internal: number },
      extra: { environment: Record<string, string>; volumes?: (typeof filedata)[] },
    ) =>
      Docker.Container(id, {
        // The id, not the tag, so a rebuilt image replaces the container.
        image: app.imageId,
        command: ["serve", name],
        environment: { ...env, ...extra.environment },
        ports: [port],
        volumes: extra.volumes,
        networks: [{ name: net.name, aliases: [name] }],
        restart: "unless-stopped",
        // Stands in for compose's `depends_on: migrate`: the label waits on the migration.
        labels: { migration: Output.map(migration.hash, (h) => h.input ?? "") },
        healthcheck: {
          cmd: `template-cli health ${name}`,
          interval: "30 seconds",
          timeout: "5 seconds",
          retries: 3,
          startPeriod: "60 seconds",
          startInterval: "2 seconds",
        },
        start: true,
      });

    yield* serve(
      "Api",
      "api",
      { external: 18080, internal: 3000 },
      { environment: { API_PORT: "3000" }, volumes: [filedata] },
    );
    yield* serve("Mcp", "mcp", { external: 13001, internal: 3001 }, { environment: { MCP_PORT: "3001" } });
    yield* serve(
      "Auth",
      "auth",
      { external: 13002, internal: 3002 },
      {
        environment: { PORT: "3002", AUTH_PERSIST: "/data/auth.json" },
        volumes: [{ hostPath: authdata.name, containerPath: "/data" }],
      },
    );
    yield* serve(
      "Dashboard",
      "dashboard",
      { external: 13000, internal: 3000 },
      { environment: { PORT: "3000" }, volumes: [filedata] },
    );

    return {
      dashboard: "http://localhost:13000",
      api: "http://localhost:18080",
      mcp: "http://localhost:13001/mcp",
      auth: "http://localhost:13002",
    };
  }),
);
