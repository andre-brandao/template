import { detail, marker, match, plain, row, type Raw } from "../body";
import type { Adapter, Comment } from "../port";

/** In-process tracker for dev and tests; lost on restart. Threads are issues, as on GitHub. */
export function memory(): Adapter {
  const issues: Raw[] = [];
  const notes: Comment[] = [];

  const count = (raw: Raw) => ({
    ...raw,
    comments: notes.filter((n) => n.thread === raw.id).length,
  });
  const feed = () => issues.filter((raw) => plain(raw.body)).map((raw) => row(count(raw)));

  function open(title: string, body: string) {
    const time = new Date().toISOString();
    const raw = {
      id: issues.length + 1,
      title,
      body,
      state: "open" as const,
      time,
      updated: time,
      comments: 0,
    };
    issues.push(raw);
    return raw;
  }

  return {
    async create(entry) {
      return row(open(entry.title, entry.body));
    },
    async list(filter) {
      return feed().filter(match(filter)).reverse();
    },
    async mine(user) {
      return feed()
        .filter((one) => one.user === user)
        .reverse();
    },
    async get(id) {
      const hit = issues.find((raw) => raw.id === id && plain(raw.body));
      if (!hit) return null;
      return detail(
        count(hit),
        notes.filter((n) => n.thread === id),
      );
    },
    async thread(key, title) {
      const hit =
        issues.find((raw) => raw.body.includes(marker(key))) ??
        open(title, `${title}\n\n${marker(key)}`);
      return { id: hit.id, key };
    },
    async comments(thread) {
      return notes.filter((n) => n.thread === thread.id).map((n) => ({ ...n }));
    },
    async comment(thread, body) {
      const note = {
        id: notes.length + 1,
        thread: thread.id,
        body,
        time: new Date().toISOString(),
      };
      notes.push(note);
      return { ...note };
    },
    async edit(comment, body) {
      const hit = notes.find((n) => n.id === comment.id);
      if (!hit) throw new Error(`Unknown comment ${comment.id}`);
      hit.body = body;
    },
  };
}
