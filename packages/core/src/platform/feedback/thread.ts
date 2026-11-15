import { use } from "./driver";
import type { Comment, Thread } from "./port";

// Building blocks for other features (experiments). No checks here: the caller's op holds them.

/** Finds or opens the one thread for `key`; `title` only applies on creation. */
export const thread = (key: string, title: string) => use().thread(key, title);
/** Oldest first. The github adapter caches for 30s; `comment` and `edit` clear it. */
export const comments = (thread: Thread) => use().comments(thread);
export const comment = (thread: Thread, body: string) => use().comment(thread, body);
export const edit = (comment: Comment, body: string) => use().edit(comment, body);
