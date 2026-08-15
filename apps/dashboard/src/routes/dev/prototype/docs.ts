// The prototype docs live outside the app, next to the repo root; vite dev runs from apps/dashboard.
const dir = `${process.cwd()}/../../docs/prototype`;

// Frontmatter is plain `key: value` lines between --- fences, same as the `bun prototype` viewer.
function meta(text: string) {
  const found = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!found?.[1]) return {} as Record<string, string>;
  return Object.fromEntries(
    found[1].split("\n").flatMap((line) => {
      const at = line.indexOf(":");
      return at > 0 ? [[line.slice(0, at).trim(), line.slice(at + 1).trim()]] : [];
    }),
  ) as Record<string, string>;
}

/** Both params land in a filesystem path, so nothing but a bare name gets through. */
export const safe = (name: string) => /^[\w.-]+$/.test(name) && !name.includes("..");

export async function list() {
  const found = await Array.fromAsync(new Bun.Glob("*/PROTOTYPE.md").scan(dir));
  return Promise.all(
    found.sort().map(async (entry) => {
      const name = entry.slice(0, entry.indexOf("/"));
      const data = meta(await Bun.file(`${dir}/${entry}`).text());
      return {
        name,
        title: data.title ?? name,
        description: data.description,
        status: data.status,
      };
    }),
  );
}

/** The tabs: PROTOTYPE first, companions after it alphabetically. */
export async function docs(name: string) {
  const found = await Array.fromAsync(new Bun.Glob("*.md").scan(`${dir}/${name}`));
  return found
    .map((one) => one.replace(/\.md$/, ""))
    .sort((a, b) => (a === "PROTOTYPE" ? -1 : b === "PROTOTYPE" ? 1 : a.localeCompare(b)));
}

export const read = (name: string, file: string) => Bun.file(`${dir}/${name}/${file}`);
