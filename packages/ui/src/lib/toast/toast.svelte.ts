export type Kind = "info" | "success" | "error" | "loading";

export type Opts = {
  duration?: number;
  action?: { label: string; onclick: () => void };
};

type Item = {
  id: number;
  kind: Kind;
  text: string;
  action?: Opts["action"];
  /** Dismissed, but still on screen playing its exit. */
  gone: boolean;
  left: number;
  at: number;
  timer?: ReturnType<typeof setTimeout>;
};

/** Beyond this the oldest is evicted — including a sticky `loading` one, if a burst outruns it. */
const LIMIT = 3;
/** Must outlast the exit transition in `Toaster.svelte`. */
const EXIT = 250;

const life = (kind: Kind) => (kind === "loading" ? 0 : kind === "error" ? 6000 : 4000);

/**
 * Module state, not context: a toast is only ever raised from a browser event, so this is
 * never written during SSR — and that is what buys the flat `toast.success(...)` call from
 * anywhere, with no component-init constraint.
 */
const items = $state<Item[]>([]);
let seq = 0;

function add(kind: Kind, text: string, opts?: Opts) {
  const live = items.filter((t) => !t.gone);
  if (live.length >= LIMIT) kill(live[0].id);
  const item: Item = {
    id: ++seq,
    kind,
    text,
    action: opts?.action,
    gone: false,
    left: opts?.duration ?? life(kind),
    at: 0,
  };
  items.push(item);
  arm(item);
  return item.id;
}

function arm(item: Item) {
  clearTimeout(item.timer);
  item.timer = undefined;
  if (!item.left) return;
  item.at = Date.now();
  item.timer = setTimeout(() => kill(item.id), item.left);
}

function kill(id: number) {
  const item = items.find((t) => t.id === id);
  if (!item || item.gone) return;
  clearTimeout(item.timer);
  item.timer = undefined;
  item.gone = true;
  setTimeout(() => {
    const i = items.findIndex((t) => t.id === id);
    if (i >= 0) items.splice(i, 1);
  }, EXIT);
}

/** Same slot, new meaning: a settled promise rewrites its loading toast in place. */
function swap(id: number, kind: Kind, text: string) {
  const item = items.find((t) => t.id === id);
  if (!item) return;
  item.kind = kind;
  item.text = text;
  item.left = life(kind);
  arm(item);
}

type Msg<T> = {
  loading: string;
  success: string | ((v: T) => string);
  error: string | ((e: unknown) => string);
};

function promise<T>(p: Promise<T>, msg: Msg<T>) {
  const id = add("loading", msg.loading);
  p.then(
    (v) => swap(id, "success", typeof msg.success === "function" ? msg.success(v) : msg.success),
    (e) => swap(id, "error", typeof msg.error === "function" ? msg.error(e) : msg.error),
  );
  return p;
}

export const toast = Object.assign((text: string, opts?: Opts) => add("info", text, opts), {
  success: (text: string, opts?: Opts) => add("success", text, opts),
  error: (text: string, opts?: Opts) => add("error", text, opts),
  loading: (text: string, opts?: Opts) => add("loading", text, opts),
  promise,
  /** No id clears the lot. */
  dismiss(id?: number) {
    if (id !== undefined) return kill(id);
    items.forEach((t) => kill(t.id));
  },
});

/** Viewport wiring. `Toaster` is the only consumer; the barrel exports `toast` alone. */
export const queue = {
  get items() {
    return items;
  },
  kill,
  /** Hovering freezes every countdown where it stands. */
  pause() {
    items.forEach((t) => {
      if (!t.timer) return;
      clearTimeout(t.timer);
      t.timer = undefined;
      t.left = Math.max(0, t.left - (Date.now() - t.at));
    });
  },
  resume() {
    items.forEach((t) => !t.gone && arm(t));
  },
};
