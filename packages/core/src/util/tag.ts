import { z } from "zod";

/** One label. `todo` and `event` both store tags, so both validate them the same way. */
export const Tag = z.string().trim().min(1).max(64);

export const Tags = Tag.array().max(20);

/** Trimmed and deduplicated, empties dropped — the stored shape of a tag list. */
export function clean(list?: string[]) {
  return [...new Set((list ?? []).map((tag) => tag.trim()).filter(Boolean))];
}
