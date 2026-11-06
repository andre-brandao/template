import { modelMessagesToUIMessages, type ModelMessage } from "@tanstack/ai";
import type { UIMessage } from "@tanstack/ai-svelte";
import type { CallPart, ResultPart } from "./views";

type Part = UIMessage["parts"][number];
type Call = { part: CallPart; result?: ResultPart };

/**
 * Stored messages back into what the chat renders. A tool result without its call is
 * dropped: sent back to the model, it fails the whole run.
 */
export function transcript(messages: { content: unknown }[]) {
  const rows = messages.map((message) => message.content as ModelMessage);
  const calls = new Set(
    rows
      .flatMap((row) => (row.role === "assistant" ? (row.toolCalls ?? []) : []))
      .map((call) => call.id),
  );
  return modelMessagesToUIMessages(
    rows.filter((row) => row.role !== "tool" || (!!row.toolCallId && calls.has(row.toolCallId))),
  );
}

// A generic chip (no custom view) for the same tool as the item before it.
function joins(prev: Part, part: CallPart, custom: (name: string) => boolean) {
  return prev.type === "tool-call" && prev.name === part.name && !custom(part.name);
}

/**
 * Message parts into rendered items: consecutive generic chips for the same tool collapse
 * into one. Only text and tool-call render, so result parts between calls don't break a run.
 */
export function group(
  parts: Part[],
  custom: (name: string) => boolean,
  finished: (call: Call) => boolean,
) {
  // Server tools answer with a separate tool-result part instead of completing the call.
  const results = new Map(
    parts
      .filter((part): part is ResultPart => part.type === "tool-result")
      .map((part) => [part.toolCallId, part]),
  );
  return parts.reduce<{ key: number; part: Part; calls: Call[]; done: boolean }[]>(
    (list, part, i) => {
      if (part.type === "text") return [...list, { key: i, part, calls: [], done: false }];
      if (part.type !== "tool-call") return list;
      const call = { part, result: results.get(part.id) };
      const prev = list.at(-1);
      if (!prev || !joins(prev.part, part, custom))
        return [...list, { key: i, part, calls: [call], done: finished(call) }];
      return [
        ...list.slice(0, -1),
        { key: prev.key, part, calls: [...prev.calls, call], done: prev.done && finished(call) },
      ];
    },
    [],
  );
}
