#!/usr/bin/env bun

import { SQL } from "bun";
import { sign } from "@template/core/util/sign";
import { boxed } from "../utils/box";

const port = Number(process.env.HOOK_PORT ?? 4000);
// Reply with this to exercise the retry path and the auto-disable counter.
const status = Number(process.env.STATUS ?? 200);

// The URL goes out before the prompt so it can be pasted into /admin/webhooks first —
// the secret only exists once that endpoint has been created.
console.log(
  boxed([
    "WEBHOOK RECEIVER",
    "",
    `endpoint  http://localhost:${port}/`,
    `ui        http://localhost:${port}`,
  ]),
);

// Asked for rather than defaulted away: an unchecked receiver proves less than it looks.
const secret = process.env.SECRET || prompt("Signing secret (blank to skip checks):") || "";

const db = new SQL("sqlite://:memory:");
await db`
  create table hit (
    id integer primary key autoincrement,
    at text not null,
    event text,
    type text,
    valid integer,
    headers text not null,
    body text not null
  )
`;

/** Null when no SECRET is configured — unchecked reads differently from failed. */
async function check(headers: Headers, body: string) {
  if (!secret) return null;
  const at = Number(headers.get("x-webhook-timestamp"));
  if (!at) return 0;
  return headers.get("x-webhook-signature") === (await sign(secret, body, at)) ? 1 : 0;
}

/** Stores the delivery and hands the row back so it can go straight out over the socket. */
async function record(req: Request) {
  const body = await req.text();
  const type = body.startsWith("{") ? (JSON.parse(body).type ?? null) : null;
  const rows = await db`
    insert into hit (at, event, type, valid, headers, body)
    values (
      ${new Date().toISOString()},
      ${req.headers.get("x-webhook-id")},
      ${type},
      ${await check(req.headers, body)},
      ${JSON.stringify(Object.fromEntries(req.headers))},
      ${body}
    )
    returning *
  `;
  return rows[0];
}

const page = `<!doctype html>
<meta charset="utf-8" />
<title>Webhook receiver</title>
<style>
  :root { color-scheme: dark }
  body { margin: 0; padding: 2rem; background: #0d0f12; color: #e6e6e6;
         font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace }
  header { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem }
  h1 { margin: 0; font-size: 1.1rem; font-weight: 600 }
  .sub { color: #7c8798 }
  button { font: inherit; color: inherit; background: #1a1f26; border: 1px solid #2b323c;
           border-radius: 6px; padding: .3rem .7rem; cursor: pointer }
  button:hover { border-color: #3d4753 }
  .hit { border: 1px solid #232932; border-left: 3px solid #3d4753; border-radius: 6px;
         padding: .7rem .9rem; margin-bottom: .6rem; background: #12151a }
  .hit.ok { border-left-color: #35c08a }
  .hit.bad { border-left-color: #d75f5f }
  .top { display: flex; gap: .8rem; align-items: baseline; flex-wrap: wrap }
  .type { font-weight: 600 }
  .meta { color: #7c8798; font-size: .8rem }
  pre { margin: .6rem 0 0; padding: .6rem; background: #0a0c0f; border-radius: 4px;
        overflow-x: auto; font-size: .8rem }
  .empty { color: #7c8798 }
</style>
<header>
  <h1>Webhook receiver</h1>
  <span class="sub" id="count"></span>
  <button onclick="wipe()">Clear</button>
</header>
<div id="list"></div>
<script>
  let hits = [];

  const badge = (v) => v === null ? '<span class="meta">unchecked</span>'
    : v ? '<span class="meta">signature ok</span>' : '<span class="meta">BAD SIGNATURE</span>';

  function draw() {
    document.getElementById('count').textContent =
      hits.length ? hits.length + ' received' : 'waiting for deliveries';
    document.getElementById('list').innerHTML = hits.length
      ? hits.map((h) => \`
        <div class="hit \${h.valid === null ? '' : h.valid ? 'ok' : 'bad'}">
          <div class="top">
            <span class="type">\${h.type ?? 'unknown'}</span>
            <span class="meta">\${new Date(h.at).toLocaleTimeString()}</span>
            <span class="meta">\${h.event ?? ''}</span>
            \${badge(h.valid)}
          </div>
          <pre>\${JSON.stringify(JSON.parse(h.body), null, 2)}</pre>
        </div>\`).join('')
      : '<p class="empty">Point a webhook at this port and trigger an event.</p>';
  }

  async function wipe() {
    await fetch('/hits', { method: 'DELETE' });
  }

  // Seed from the backlog, then let the socket push everything after it.
  fetch('/hits').then((r) => r.json()).then((rows) => { hits = rows; draw(); });

  const ws = new WebSocket(\`ws://\${location.host}/ws\`);
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    hits = msg.kind === 'clear' ? [] : [msg.hit, ...hits];
    draw();
  };
</script>`;

const server = Bun.serve({
  port,
  routes: {
    "/": {
      GET: () => new Response(page, { headers: { "content-type": "text/html" } }),
      POST: async (req) => {
        await push(req);
        return new Response("ok", { status });
      },
    },
    "/hits": {
      GET: async () => Response.json(await db`select * from hit order by id desc`),
      DELETE: async () => {
        await db`delete from hit`;
        server.publish("hits", JSON.stringify({ kind: "clear" }));
        return new Response(null, { status: 204 });
      },
    },
  },
  websocket: {
    open: (ws) => ws.subscribe("hits"),
    message: () => {},
  },
  // Deliveries can point at any path; only the socket upgrade is special.
  fetch: async (req, server) => {
    if (new URL(req.url).pathname === "/ws" && server.upgrade(req)) return;
    if (req.method !== "POST") return new Response("not found", { status: 404 });
    await push(req);
    return new Response("ok", { status });
  },
});

/** Records, then fans the row out to every open page. */
async function push(req: Request) {
  server.publish("hits", JSON.stringify({ kind: "hit", hit: await record(req) }));
}

console.log(secret ? "Listening, checking signatures" : "Listening, signatures unchecked");
if (status !== 200) console.log(`Replying ${status} to every delivery`);
