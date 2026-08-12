#!/usr/bin/env bun

// Serves docs/prototype/<feature>/PROTOTYPE.md as HTML so the embedded
// .html mockups render inside their iframes. Zero deps: Bun.markdown.

const root = `${import.meta.dir}/..`;
const dir = `${root}/docs/prototype`;
const port = Number(process.env.PORT ?? 4400);

// Frontmatter: plain `key: value` lines between --- fences. title/description
// feed the index cards; status/date show as badges.
function meta(text: string) {
  const found = text.match(/^---\n([\s\S]*?)\n---\n/);
  const head = found?.[1];
  if (!head) return { body: text, data: {} as Record<string, string> };
  const data: Record<string, string> = Object.fromEntries(
    head.split("\n").flatMap((line) => {
      const at = line.indexOf(":");
      return at > 0 ? [[line.slice(0, at).trim(), line.slice(at + 1).trim()]] : [];
    }),
  );
  return { body: text.slice(found[0].length), data };
}

function shell(title: string, crumbs: string, body: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<script>
  document.documentElement.dataset.theme =
    localStorage.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
</script>
<style>
  :root { color-scheme: light; --bg: #ffffff; --fg: #1a1a1a; --dim: #6b7280; --line: #e5e7eb; --code: #f4f4f5; }
  :root[data-theme="dark"] { color-scheme: dark; --bg: #0e0e11; --fg: #e7e7ea; --dim: #9ca3af; --line: #27272a; --code: #1b1b1f; }
  * { box-sizing: border-box; }
  body { margin: 0 auto; padding: 5.5rem 1.5rem 6rem; max-width: 60rem; background: var(--bg); color: var(--fg);
    font: 16px/1.6 system-ui, sans-serif; }
  nav { position: fixed; top: 0; left: 0; right: 0; z-index: 10; display: flex; align-items: center;
    gap: 0.6rem; padding: 0.6rem 1.5rem; background: var(--bg); border-bottom: 1px solid var(--line); }
  nav a { color: var(--dim); text-decoration: none; }
  nav a:hover { color: var(--fg); }
  nav .here { color: var(--fg); font-weight: 600; }
  nav .sep { color: var(--line); }
  h1, h2, h3 { line-height: 1.25; }
  h2 { margin-top: 2.5em; border-bottom: 1px solid var(--line); padding-bottom: 0.3em; }
  a { color: inherit; }
  pre { background: var(--code); border: 1px solid var(--line); border-radius: 8px; padding: 1rem; overflow-x: auto; }
  code { background: var(--code); border-radius: 4px; padding: 0.1em 0.3em; font-size: 0.9em; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid var(--line); padding: 0.4em 0.8em; text-align: left; }
  blockquote { margin: 1em 0; padding: 0.1em 1em; border-left: 3px solid var(--line); color: var(--dim); }
  iframe { width: 100%; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
  pre.mermaid { background: none; border: none; text-align: center; }
  #theme { margin-left: auto; width: 2rem; height: 2rem; cursor: pointer;
    border: 1px solid var(--line); border-radius: 999px; background: var(--bg); color: var(--fg); font-size: 0.9rem; }
  .cards { list-style: none; padding: 0; display: grid; gap: 0.75rem; }
  .cards a { display: block; border: 1px solid var(--line); border-radius: 8px; padding: 1rem 1.25rem; text-decoration: none; }
  .cards a:hover { border-color: var(--dim); }
  .cards p { margin: 0.35rem 0 0; color: var(--dim); }
  .badge { margin-left: 0.6em; padding: 0.1em 0.6em; border: 1px solid var(--line); border-radius: 999px;
    color: var(--dim); font-size: 0.75rem; vertical-align: 0.15em; }
</style>
</head>
<body>
<nav>${crumbs}<button id="theme" title="Toggle theme">◐</button></nav>
${body}
<script type="module">
  theme.onclick = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.theme = next;
    // Mermaid bakes its theme into the rendered SVG; reload to redraw.
    if (document.querySelector(".mermaid")) location.reload();
  };
  const blocks = [...document.querySelectorAll("code.language-mermaid")];
  if (blocks.length) {
    for (const block of blocks) {
      const pre = document.createElement("pre");
      pre.className = "mermaid";
      pre.textContent = block.textContent;
      block.closest("pre").replaceWith(pre);
    }
    // View-time only and per-doc; offline the raw diagram source stays visible.
    const mermaid = (await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs")).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.dataset.theme === "dark" ? "dark" : "default",
    });
    await mermaid.run();
  }
</script>
</body>
</html>`;
}

async function index() {
  const found = await Array.fromAsync(new Bun.Glob("*/PROTOTYPE.md").scan(dir));
  const cards = await Promise.all(
    found.sort().map(async (entry) => {
      const name = entry.slice(0, entry.indexOf("/"));
      const { data } = meta(await Bun.file(`${dir}/${entry}`).text());
      const badges = [data.status, data.date]
        .filter((value): value is string => Boolean(value))
        .map((value) => `<span class="badge">${value}</span>`)
        .join("");
      const blurb = data.description ? `<p>${data.description}</p>` : "";
      return `<li><a href="/${name}/"><strong>${data.title ?? name}</strong>${badges}${blurb}</a></li>`;
    }),
  );
  return shell(
    "Prototypes",
    `<span class="here">Prototypes</span>`,
    `<h1>Prototypes</h1>\n<ul class="cards">\n${cards.join("\n")}\n</ul>`,
  );
}

async function page(name: string) {
  const file = Bun.file(`${dir}/${name}/PROTOTYPE.md`);
  if (!(await file.exists())) return null;
  const { body, data } = meta(await file.text());
  const plan = (await Bun.file(`${dir}/${name}/PLAN.md`).exists())
    ? `<span class="sep">·</span><a href="PLAN.md">plan →</a>`
    : "";
  const crumbs = `<a href="/">Prototypes</a><span class="sep">/</span><span class="here">${data.title ?? name}</span>${plan}`;
  return shell(data.title ?? name, crumbs, Bun.markdown.html(body));
}

const html = { headers: { "content-type": "text/html; charset=utf-8" } };

Bun.serve({
  port,
  async fetch(req) {
    const path = decodeURIComponent(new URL(req.url).pathname);
    if (path.includes("..")) return new Response("Not found", { status: 404 });
    if (path === "/") return new Response(await index(), html);

    const name = path.split("/")[1];
    if (!name) return new Response("Not found", { status: 404 });
    if (path === `/${name}`) return Response.redirect(`/${name}/`, 302);
    if (path === `/${name}/`) {
      const body = await page(name);
      if (!body) return new Response("Not found", { status: 404 });
      return new Response(body, html);
    }

    const file = Bun.file(`${dir}${path}`);
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    if (!path.endsWith(".md")) return new Response(file);

    // Companion docs (PLAN.md etc.) render through the same shell.
    const { body, data } = meta(await file.text());
    const crumbs = `<a href="/">Prototypes</a><span class="sep">/</span><a href="/${name}/">${name}</a><span class="sep">/</span><span class="here">${path.split("/").pop()}</span>`;
    return new Response(shell(data.title ?? name, crumbs, Bun.markdown.html(body)), html);
  },
});

console.log(`Prototypes on http://localhost:${port}`);
