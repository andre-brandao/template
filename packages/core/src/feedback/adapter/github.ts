import { forToken, found } from "../../github/client";
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
  const api = forToken(cfg.token);
  const [owner, repo] = cfg.repo.split("/");
  if (!owner || !repo) throw new Error(`FEEDBACK_REPO must be "owner/name", got "${cfg.repo}"`);
  const at = { owner, repo };

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
    const rows = api
      .paginate(api.rest.issues.listForRepo, {
        ...at,
        state: "all",
        sort: "created",
        direction: "desc",
        per_page: 100,
      })
      .then((all) => all.filter((issue) => !issue.pull_request && plain(issue.body ?? "")));
    listing.set("all", { time: Date.now(), rows });
    rows.catch(() => listing.delete("all"));
    return rows;
  }

  function notes(thread: number) {
    const hit = pages.get(thread);
    if (hit && Date.now() - hit.time < TTL) return hit.rows;
    const rows = api
      .paginate(api.rest.issues.listComments, { ...at, issue_number: thread, per_page: 100 })
      .then((all) => all.map((one) => note(thread, one)));
    pages.set(thread, { time: Date.now(), rows });
    rows.catch(() => pages.delete(thread));
    return rows;
  }

  async function lookup(key: string, title: string) {
    const open = await api.paginate(api.rest.issues.listForRepo, {
      ...at,
      labels: LABEL,
      state: "open",
      per_page: 100,
    });
    const hit = open.find((issue) => !issue.pull_request && issue.body?.includes(marker(key)));
    if (hit) return { id: hit.number, key, url: hit.html_url };
    const made = await api.rest.issues.create({
      ...at,
      title,
      body: `${title}\n\n${marker(key)}`,
      labels: [LABEL],
    });
    return { id: made.data.number, key, url: made.data.html_url };
  }

  return {
    async create(entry) {
      const res = await api.rest.issues.create({
        ...at,
        title: entry.title,
        body: entry.body,
        labels: [entry.tag, `urgency:${entry.urgency}`],
      });
      listing.clear();
      return row(raw(res.data));
    },
    async list(filter) {
      return (await issues()).map((issue) => row(raw(issue))).filter(match(filter));
    },
    async mine(user) {
      return (await issues()).map((issue) => row(raw(issue))).filter((one) => one.user === user);
    },
    async get(id) {
      const issue = await found(api.rest.issues.get({ ...at, issue_number: id }));
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
      const res = await api.rest.issues.createComment({ ...at, issue_number: thread.id, body });
      pages.delete(thread.id);
      return note(thread.id, res.data);
    },
    async edit(comment, body) {
      await api.rest.issues.updateComment({ ...at, comment_id: comment.id, body });
      pages.delete(comment.thread);
    },
  };
}
