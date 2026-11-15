import { SvelteMap } from "svelte/reactivity";
import type { Answer, Output } from "./catalog";

/**
 * The `ask` calls waiting on the user, by tool call id. The tool's run holds the promise; the
 * view answers it. A reload drops them, and the call reads as unanswered.
 */
export const waiting = new SvelteMap<string, (out: Output) => void>();

/** Calls the user chose to talk about: folded away, what they picked kept for the answer. */
export const talking = new SvelteMap<string, Answer[]>();

/** The tool's run: waits until the view answers or the conversation moves on. */
export function wait(id: string) {
  return new Promise<Output>((resolve) => waiting.set(id, resolve));
}

/** Answers a waiting call, once. */
export function answer(id: string, out: Output) {
  const resolve = waiting.get(id);
  waiting.delete(id);
  talking.delete(id);
  resolve?.(out);
}

/** "Discuss in chat": the form folds and the user's next message answers it. */
export function talk(id: string, partial: Answer[]) {
  talking.set(id, partial);
}

/** Closes every waiting call, e.g. when the chat starts over. */
export function dismiss(reason: string) {
  [...waiting.keys()].forEach((id) =>
    answer(id, { answered: false, reason, partial: talking.get(id) }),
  );
}

/** A message typed while calls wait: it answers them instead of starting a run. */
export function write(text: string) {
  [...waiting.keys()].forEach((id) =>
    answer(id, {
      answered: false,
      reason: talking.has(id)
        ? `The user wanted to discuss the form and wrote: ${text}`
        : `The user answered in text: ${text}`,
      partial: talking.get(id),
    }),
  );
}
