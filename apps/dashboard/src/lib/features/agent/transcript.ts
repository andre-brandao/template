import { modelMessagesToUIMessages, type ModelMessage } from "@tanstack/ai";

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
