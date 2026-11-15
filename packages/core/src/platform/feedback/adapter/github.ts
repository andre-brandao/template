import { detail, marker, match, plain, row } from "../body";
import type { Adapter, Comment, Thread } from "../port";

/** Threads carry this label, so finding one lists only them. */
const LABEL = "thread";
const TTL = 30_000;

type Issue = {
  number: number;
  title: string;
  body?: string | null;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  comments: number;
  pull_request?: unknown;
};

type Note = { id: number; body?: string; html_url: string; created_at: string };

/** Issues on `repo` ("owner/name"), filed with an app token rather than the sender's own. */
export function github(cfg: { token: string; repo: string }): Adapter {
  if (!/^[\w.-]+\/[\w.-]+$/.test(cfg.repo))
    throw new Error(`FEEDBACK_REPO must be "owner/name", got "${cfg.repo}"`);
  const base = `https://api.github.com/repos/${cfg.repo}`;

  // A GET that misses is null, so `get` can tell an unknown issue from a failing tracker.
  async function call(path: string, method = "GET", body?: unknown) {
    const res = await fetch(path.startsWith("https://") ? path : `${base}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${cfg.token}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
        "user-agent": "template-feedback",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 404 && method === "GET") return null;
    if (!res.ok)
      throw new Error(`GitHub ${method} ${path} failed: ${res.status} ${await res.text()}`);
    return res;
  }

  async function json<T>(path: string, method?: string, body?: unknown) {
    const res = await call(path, method, body);
    return res ? ((await res.json()) as T) : null;
  }

  /** Follows `Link: rel="next"` to the last page. */
  async function all<T>(path: string, rows: T[] = []): Promise<T[]> {
    const res = await call(path);
    if (!res) return rows;
    const next = [...rows, ...((await res.json()) as T[])];
    const link = res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
    return link ? all(link, next) : next;
  }

  // Per process, so a busy page doesn't burn the rate limit. Writes clear what they touch.
  const threads = new Map<string, Promise<Thread>>();
  const pages = new Map<number, { time: number; rows: Promise<Comment[]> }>();
  const listing = new Map<"all", { time: number; rows: Promise<Issue[]> }>();

  const raw = (issue: Issue) => ({
    id: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    url: issue.html_url,
    state: issue.state === "closed" ? ("closed" as const) : ("open" as const),
    time: issue.created_at,
    updated: issue.updated_at,
    comments: issue.comments,
  });

  const note = (thread: number, one: Note): Comment => ({
    id: one.id,
    thread,
    body: one.body ?? "",
    time: one.created_at,
    url: one.html_url,
  });

  // A plain listing, not the search API: search lags, and a fresh submission must show up.
  function issues() {
    const hit = listing.get("all");
    if (hit && Date.now() - hit.time < TTL) return hit.rows;
    const rows = all<Issue>("/issues?state=all&sort=created&direction=desc&per_page=100").then(
      (list) => list.filter((issue) => !issue.pull_request && plain(issue.body ?? "")),
    );
    listing.set("all", { time: Date.now(), rows });
    rows.catch(() => listing.delete("all"));
    return rows;
  }

  function notes(thread: number) {
    const hit = pages.get(thread);
    if (hit && Date.now() - hit.time < TTL) return hit.rows;
    const rows = all<Note>(`/issues/${thread}/comments?per_page=100`).then((list) =>
      list.map((one) => note(thread, one)),
    );
    pages.set(thread, { time: Date.now(), rows });
    rows.catch(() => pages.delete(thread));
    return rows;
  }

  async function lookup(key: string, title: string) {
    const open = await all<Issue>(`/issues?labels=${LABEL}&state=open&per_page=100`);
    const hit = open.find((issue) => !issue.pull_request && issue.body?.includes(marker(key)));
    if (hit) return { id: hit.number, key, url: hit.html_url };
    const made = await created<Issue>("/issues", {
      title,
      body: `${title}\n\n${marker(key)}`,
      labels: [LABEL],
    });
    return { id: made.number, key, url: made.html_url };
  }

  async function created<T>(path: string, body: unknown) {
    const res = await json<T>(path, "POST", body);
    if (!res) throw new Error(`GitHub POST ${path} returned nothing`);
    return res;
  }

  return {
    async create(entry) {
      const issue = await created<Issue>("/issues", {
        title: entry.title,
        body: entry.body,
        labels: [entry.tag, `urgency:${entry.urgency}`],
      });
      listing.clear();
      return row(raw(issue));
    },
    async list(filter) {
      return (await issues()).map((issue) => row(raw(issue))).filter(match(filter));
    },
    async mine(user) {
      return (await issues()).map((issue) => row(raw(issue))).filter((one) => one.user === user);
    },
    async get(id) {
      const issue = await json<Issue>(`/issues/${id}`);
      if (!issue || issue.pull_request || !plain(issue.body ?? "")) return null;
      return detail(raw(issue), await notes(id));
    },
    thread(key, title) {
      // The promise is cached, so concurrent first callers share one create.
      const hit = threads.get(key) ?? lookup(key, title);
      threads.set(key, hit);
      hit.catch(() => threads.delete(key));
      return hit;
    },
    comments(thread) {
      return notes(thread.id);
    },
    async comment(thread, body) {
      const one = await created<Note>(`/issues/${thread.id}/comments`, { body });
      pages.delete(thread.id);
      return note(thread.id, one);
    },
    async edit(comment, body) {
      await call(`/issues/comments/${comment.id}`, "PATCH", { body });
      pages.delete(comment.thread);
    },
  };
}
