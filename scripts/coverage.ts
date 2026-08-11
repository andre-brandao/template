// Aggregates per-package lcov output from `bun test --coverage` into a
// table. CI appends the output to $GITHUB_STEP_SUMMARY.
const files = [...new Bun.Glob("{packages,apps}/**/coverage/lcov.info").scanSync()].filter(
  (f) => !f.includes("node_modules"),
);

const sum = (text: string, key: string) =>
  text
    .split("\n")
    .filter((l) => l.startsWith(`${key}:`))
    .reduce((acc, l) => acc + Number(l.slice(key.length + 1)), 0);

const rows = await Promise.all(
  files.map(async (file) => {
    const text = await Bun.file(file).text();
    return {
      name: file.replace(/\/coverage\/lcov\.info$/, ""),
      fnf: sum(text, "FNF"),
      fnh: sum(text, "FNH"),
      lf: sum(text, "LF"),
      lh: sum(text, "LH"),
    };
  }),
);

const total = rows.reduce(
  (acc, r) => ({
    name: "Total",
    fnf: acc.fnf + r.fnf,
    fnh: acc.fnh + r.fnh,
    lf: acc.lf + r.lf,
    lh: acc.lh + r.lh,
  }),
  { name: "Total", fnf: 0, fnh: 0, lf: 0, lh: 0 },
);

const pct = (hit: number, found: number) =>
  found ? `${((hit / found) * 100).toFixed(1)}% (${hit}/${found})` : "—";

const table = Bun.inspect.table(
  [...rows, total].map((r) => ({
    Package: r.name,
    Functions: pct(r.fnh, r.fnf),
    Lines: pct(r.lh, r.lf),
  })),
);

console.log("## Coverage\n");
console.log("```\n" + table.trimEnd() + "\n```");
