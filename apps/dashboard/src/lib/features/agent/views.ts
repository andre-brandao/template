import type { UIMessage } from "@tanstack/ai-svelte";

type Part = UIMessage["parts"][number];
export type CallPart = Extract<Part, { type: "tool-call" }>;
export type ResultPart = Extract<Part, { type: "tool-result" }>;

/** `output` is the result's content, JSON-parsed once, or a client tool's own output. */
export type ViewProps = {
  part: CallPart;
  result?: ResultPart;
  done: boolean;
  output: unknown;
};
