/**
 * Bundles one worker entrypoint. Used by modules/bun-build.
 *
 * Not the `bun build` CLI: its `--conditions` flag does not override a package's
 * exports map, so `postgres` resolves to its Node build and drags `net`/`tls`
 * into the bundle. `Bun.build({ conditions })` does apply them, which is what
 * picks up `postgres`'s `workerd` export.
 *
 *   bun run build.ts --entry=src/api/target/worker.ts --outfile=dist/api/worker.js
 */

const args = new Map(
  process.argv.slice(2).flatMap((a) => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [[k, rest.join("=")]] as [string, string][];
  }),
);

const many = (k: string) =>
  process.argv
    .slice(2)
    .filter((a) => a.startsWith(`--${k}=`))
    .map((a) => a.slice(k.length + 3));

const entry = args.get("entry");
const outfile = args.get("outfile");
if (!entry || !outfile) throw new Error("--entry and --outfile are required");

const loader = Object.fromEntries(
  many("loader").map((l) => {
    const [ext, kind] = l.split(":");
    return [ext, kind];
  }),
) as Record<string, "text">;

const out = await Bun.build({
  entrypoints: [entry],
  target: (args.get("target") ?? "node") as "node",
  format: (args.get("format") ?? "esm") as "esm",
  conditions: (args.get("conditions") ?? "workerd,worker,browser").split(","),
  external: many("external"),
  minify: args.get("minify") !== "false",
  sourcemap: (args.get("sourcemap") ?? "none") as "none",
  loader,
});

if (!out.success) {
  for (const log of out.logs) console.error(log);
  process.exit(1);
}

const [built] = out.outputs;
await Bun.write(outfile, built);
console.log(`${outfile}  ${(built.size / 1e6).toFixed(2)} MB`);
