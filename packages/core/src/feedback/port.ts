export const Tags = ["bug", "feature", "support"] as const;
export const Urgencies = ["low", "medium", "high"] as const;

export type Tag = (typeof Tags)[number];
export type Urgency = (typeof Urgencies)[number];

/** One submission as filed: `body` already carries the trailer and the hidden sender marker. */
export type Entry = { title: string; body: string; tag: Tag; urgency: Urgency };

/** A submission as the tracker sees it now. `from` is the trailer's sender line, `user` the marker's id. */
export type Row = {
  id: number;
  title: string;
  url?: string;
  state: "open" | "closed";
  tag: Tag;
  urgency: Urgency;
  from: string | null;
  user: string | null;
  time: string;
  updated: string;
  comments: number;
};

export type Comment = { id: number; thread: number; body: string; time: string; url?: string };

/** `text` is what the sender wrote (attachments included), without the trailer. */
export type Detail = Row & { body: string; text: string; replies: Comment[] };

/** A long-lived item other features append comments to, one per `key`. */
export type Thread = { id: number; key: string; url?: string };

export type Filter = { state?: Row["state"]; tag?: Tag };

/** Where feedback lands. Adapters trust their caller; the ops in `issue.ts` hold the checks. */
export interface Adapter {
  create(entry: Entry): Promise<Row>;
  /** Everyone's, newest first; never includes threads. */
  list(filter: Filter): Promise<Row[]>;
  /** One sender's, newest first, found by the hidden marker rather than the visible trailer. */
  mine(user: string): Promise<Row[]>;
  /** Null when the tracker has no such submission (or it is a thread). */
  get(id: number): Promise<Detail | null>;
  /** Finds or opens the thread for `key`; `title` only applies on creation. */
  thread(key: string, title: string): Promise<Thread>;
  /** Oldest first. */
  comments(thread: Thread): Promise<Comment[]>;
  comment(thread: Thread, body: string): Promise<Comment>;
  /** Rewrites one comment in place, so a caller can keep a single comment per user. */
  edit(comment: Comment, body: string): Promise<void>;
}
