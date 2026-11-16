import { Database } from "@template/core/drizzle";
import { Queue } from "@template/core/queue";
import { Workspaces } from "@template/core/workspaces";
import { value } from "./args";

const subcommands: Record<string, (rest: string[]) => Promise<void>> = {
  /** Registers `<slug>` (owner-less: no identity here); the `sync` queue runs its setup job inline. */
  async create(rest) {
    const slug = rest[0];
    if (!slug || slug.startsWith("--"))
      throw new Error("Usage: template-cli workspace create <slug> [--name]");
    const created = await Queue.provide(Queue.fromEnv({ QUEUE_DRIVER: "sync" }), () =>
      Workspaces.create({ slug, name: value(rest, "--name") ?? slug }),
    );
    console.log(JSON.stringify(created));
  },
  async list() {
    console.log(JSON.stringify(await Workspaces.all(), null, 2));
  },
};

export async function workspace(rest: string[]) {
  const run = subcommands[rest[0] ?? ""];
  if (!run) {
    console.error(`Usage: template-cli workspace <${Object.keys(subcommands).join("|")}>`);
    process.exit(1);
  }
  const client = Database.connect(process.env.DATABASE_URL ?? Database.DEFAULT_URL, { max: 1 });
  await Database.provide(client, () => run(rest.slice(1)));
  await Database.release(client);
}
