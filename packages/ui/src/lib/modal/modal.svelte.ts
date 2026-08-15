import type { Component, Snippet } from "svelte";

export type Ask = {
  title: string;
  /** The prose above the buttons — a snippet, so a caller can bold the subject mid-sentence. */
  body: Snippet;
  /** Label on the danger button. */
  action: string;
  /** When set, the button stays disabled until this exact text is typed back. */
  verify?: string;
};

type Slot =
  | { kind: "ask"; opts: Ask; done: (v: unknown) => void }
  | {
      kind: "of";
      of: Component<any>;
      props: Record<string, unknown>;
      done: (v: unknown) => void;
    };

/**
 * Module state, not context: a modal is only ever raised from a browser event, so this is
 * never written during SSR — the same reasoning that buys `toast` its flat call.
 */
let current = $state<Slot>();

/** One slot. Opening over a live modal dismisses it, so no caller is left awaiting forever. */
function push(next: Slot) {
  modal.close();
  current = next;
}

export const modal = Object.assign(
  /** Renders any component in the dialog chrome. It receives a `close` prop to resolve with. */
  <T>(of: Component<any>, props: Record<string, unknown> = {}) =>
    new Promise<T | undefined>((done) =>
      push({ kind: "of", of, props, done: done as (v: unknown) => void }),
    ),
  {
    confirm: (opts: Ask) =>
      new Promise<boolean>((done) => push({ kind: "ask", opts, done: (v) => done(v === true) })),
    /** Dismissal resolves the waiting caller — `false` for a confirm, `undefined` otherwise. */
    close(value?: unknown) {
      const slot = current;
      if (!slot) return;
      current = undefined;
      slot.done(value);
    },
  },
);

/** Viewport wiring. `Modals` is the only consumer; the barrel exports `modal` alone. */
export const slot = {
  get current() {
    return current;
  },
};
