/**
 * Two-way sync between projects and GitHub, Linear-style: webhooks on a connected repo write
 * issues in, edits to a todo already mirroring an issue push back, and nothing creates an
 * issue implicitly. One folder per feature; `github.ts` lists them.
 */
export * as Github from "./github";
