import { browser } from "$app/environment";
import { page } from "$app/state";
import { createContext, type Component } from "svelte";
import { MediaQuery } from "svelte/reactivity";
import type { AnyClientTool } from "@tanstack/ai";
import { createChat, fetchServerSentEvents, type UIMessage } from "@tanstack/ai-svelte";
import { getConversation } from "./api/agent.remote";
import { dismiss, talking, waiting, write } from "./ask/pending";
import { transcript } from "./transcript";
import type { CallPart, ViewProps } from "./views";

/**
 * The agent drawer and its chat. Lives in root-layout context so the conversation survives
 * navigation; past ones come back from the history by their thread.
 */
const [agent, set] = createContext<ReturnType<typeof create>>();

export { agent };

// The dock's width in px when nothing is saved.
const fallback = 400;
const key = "agent-width";

// Storage can throw (private window, blocked site data); then the width lives for this visit.
function saved() {
  try {
    return Number(localStorage.getItem(key)) || undefined;
  } catch {
    return undefined;
  }
}

function save(width: number | undefined) {
  try {
    if (!width) return localStorage.removeItem(key);
    localStorage.setItem(key, String(width));
  } catch {
    // Not saved; the width still holds for this visit.
  }
}

/** Call once, in the root layout. */
export function createAgent() {
  set(create());
}

function create() {
  let open = $state(false);
  let full = $state(false);
  // Desktop dock width in px, undefined for the default. The dock clamps it to the viewport.
  let width = $state<number>();
  let model = $state<string>();
  let tab = $state<"chat" | "history" | "tools">("chat");
  // The page tools and their views, set once by the dock.
  let tools = $state.raw<AnyClientTool[]>([]);
  let views = $state.raw<Record<string, Component<ViewProps>>>({});
  // Where focus was before the dock opened, so closing hands it back.
  let back: HTMLElement | undefined;
  // The Shell's breakpoint: below it the dock is the whole screen.
  const narrow = new MediaQuery("max-width: 700px");

  // A chat's identity is its `threadId`, the recorded conversation, so another thread gets
  // another chat. Its own effect root keeps the tools synced; SSR has no effects.
  function spawn(thread: string, initialMessages?: UIMessage[]) {
    const make = () =>
      createChat({
        threadId: thread,
        initialMessages,
        connection: fetchServerSentEvents("/agent"),
        get tools() {
          return tools;
        },
      });
    if (!browser) return { thread, chat: make(), stop: () => {} };
    let chat!: ReturnType<typeof make>;
    const stop = $effect.root(() => {
      chat = make();
    });
    return { thread, chat, stop };
  }

  // Only the browser sends, so SSR's thread is never recorded.
  let current = $state.raw(spawn(browser ? crypto.randomUUID() : "ssr"));

  function swap(thread: string, initialMessages?: UIMessage[]) {
    current.chat.stop();
    current.chat.dispose();
    current.stop();
    current = spawn(thread, initialMessages);
  }

  function close() {
    open = false;
    full = false;
    back?.focus();
    back = undefined;
  }

  return {
    get open() {
      return open;
    },
    toggle() {
      if (open) return close();
      back = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      open = true;
      // Read on first open: the dock starts closed, so SSR never needs the width.
      width ??= saved();
    },
    close,
    get narrow() {
      return narrow.current;
    },
    get width(): number {
      return width ?? fallback;
    },
    /** `undefined` resets to the default. */
    set width(value: number | undefined) {
      width = value && Math.round(value);
      save(width);
    },
    get tools() {
      return tools;
    },
    get views() {
      return views;
    },
    /** The client tools every run gets, and the views that draw them by tool name. */
    equip(list: AnyClientTool[], extra: Record<string, Component<ViewProps>>) {
      tools = list;
      views = extra;
    },
    get full() {
      return full;
    },
    widen() {
      full = !full;
    },
    get model() {
      return model;
    },
    set model(value) {
      model = value;
    },
    get tab() {
      return tab;
    },
    set tab(value) {
      tab = value;
    },
    get thread() {
      return current.thread;
    },
    get chat() {
      return current.chat;
    },
    /** What the agent is doing: waiting on a form, writing, or thinking (with the tool). */
    get activity(): { state: "idle" | "waiting" | "writing" | "thinking"; tool?: string } {
      if ([...waiting.keys()].some((id) => !talking.has(id))) return { state: "waiting" };
      const chat = current.chat;
      if (!chat.isLoading) return { state: "idle" };
      const start = chat.messages.findLastIndex((message) => message.role === "user");
      const parts = chat.messages.slice(start + 1).flatMap((message) => message.parts);
      const last = parts.at(-1);
      if (last?.type === "text" && last.content) return { state: "writing" };
      const done = new Set(
        parts.flatMap((part) => (part.type === "tool-result" ? [part.toolCallId] : [])),
      );
      const running = parts.findLast(
        (part): part is CallPart =>
          part.type === "tool-call" &&
          part.output === undefined &&
          part.state !== "error" &&
          !done.has(part.id),
      );
      return { state: "thinking", tool: running?.name };
    },
    /** Starts over on a new thread, so the next run opens a new conversation. */
    fresh() {
      dismiss("The user started another conversation.");
      swap(crypto.randomUUID());
      tab = "chat";
    },
    /** Loads a recorded conversation into the chat; the next run appends to it. */
    async resume(id: string) {
      const detail = await getConversation(id);
      dismiss("The user opened another conversation.");
      swap(detail.thread, transcript(detail.messages));
      tab = "chat";
    },
    /** `forwardedProps` carry the model and the page to the server; the thread is `threadId`. */
    send(text: string) {
      // Typed while an `ask` waits, the text answers it instead of starting a run.
      if (waiting.size) return write(text);
      const chat = current.chat;
      // Set on the client, not per call: a page tool's follow-up request must carry them too.
      chat.updateForwardedProps({
        model,
        page: {
          url: page.url.pathname + page.url.search,
          title: document.title.slice(0, 200),
          crumbs: (page.data.nav?.crumbs ?? []).map((crumb: { label: string }) => crumb.label),
        },
      });
      return chat.sendMessage(text);
    },
  };
}
