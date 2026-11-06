import { browser } from "$app/environment";
import { page } from "$app/state";
import { createContext, onDestroy, type Component } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import type { AnyClientTool } from "@tanstack/ai";
import { createChat, createRegisterWebMCPTools, fetchServerSentEvents } from "@tanstack/ai-svelte";
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

// Tools the mounted pages declare. Browser only, so SSR never leaks into this set.
const registry = new SvelteSet<AnyClientTool>();

/** Views the mounted pages bring for their own tools, by tool name. */
export const views = new SvelteMap<string, Component<ViewProps>>();

/** Call once, in the root layout. */
export function createAgent() {
  set(create());
}

/** Declares client tools, and their optional views, for as long as the caller is mounted. */
export function pageTools(list: AnyClientTool[], extra: Record<string, Component<ViewProps>> = {}) {
  if (!browser) return;
  const entries = Object.entries(extra);
  list.forEach((tool) => registry.add(tool));
  entries.forEach(([name, view]) => views.set(name, view));
  onDestroy(() => {
    list.forEach((tool) => registry.delete(tool));
    // Another page may have claimed the name since; only drop our own.
    entries.forEach(([name, view]) => views.get(name) === view && views.delete(name));
  });
  // Also exposed to external WebMCP browser agents.
  createRegisterWebMCPTools(list);
}

function create() {
  let open = $state(false);
  let full = $state(false);
  let model = $state<string>();
  let tab = $state<"chat" | "history">("chat");
  // Keys the recorded conversation. Only the browser sends, so SSR can leave it empty.
  let thread = $state(browser ? crypto.randomUUID() : "");

  const chat = createChat({
    connection: fetchServerSentEvents("/agent"),
    get tools() {
      return [...registry];
    },
  });

  return {
    get open() {
      return open;
    },
    toggle() {
      open = !open;
    },
    close() {
      open = false;
      full = false;
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
      return thread;
    },
    chat,
    /** What the agent is doing: waiting on a form, writing, or thinking (with the tool). */
    get activity(): { state: "idle" | "waiting" | "writing" | "thinking"; tool?: string } {
      if ([...waiting.keys()].some((id) => !talking.has(id))) return { state: "waiting" };
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
      chat.stop();
      chat.clear();
      thread = crypto.randomUUID();
      tab = "chat";
    },
    /** Loads a recorded conversation into the chat; the next run appends to it. */
    async resume(id: string) {
      const detail = await getConversation(id);
      dismiss("The user opened another conversation.");
      chat.stop();
      chat.setMessages(transcript(detail.messages));
      thread = detail.thread;
      tab = "chat";
    },
    /** `forwardedProps` carry the model, the thread and the page to the server. */
    send(text: string) {
      // Typed while an `ask` waits, the text answers it instead of starting a run.
      if (waiting.size) return write(text);
      // Set on the client, not per call: a page tool's follow-up request must keep the thread,
      // or the recorder splits the conversation in two.
      chat.updateForwardedProps({
        model,
        thread,
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
