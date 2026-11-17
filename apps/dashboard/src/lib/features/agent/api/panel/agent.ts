import { AsyncLocalStorage } from "node:async_hooks";
import { chat, defineAgent, toolDefinition, type StreamChunk } from "@tanstack/ai";
import type { z } from "zod";
import { Model } from "@template/agent";
import { Identity } from "@template/core/identity";
import { instructions, shape } from "../../panel/catalog";
import { check } from "../../panel/check";
import { Agent } from "../core";
import { relax } from "../tools";
import { Sql } from "./sql";

type Draft = z.infer<typeof shape>;

const guide = `You build dashboard panels for an admin, from a brief the Assistant gives you.
Explore the data with the SQL tools, then call \`draft\` with a spec whose every data block carries SQL you tested. Fix what \`draft\` reports and call it again until it is ok: the last ok draft is your result.
End with one short line on what the panel shows; never repeat the spec or its numbers.
If the brief is a quick question rather than a panel, answer it in a short markdown table and skip \`draft\`.`;

/** For the orchestrator when `panel` is offered. */
export const delegate = `Delegate data questions and panels to \`panel\` with a brief: the question, the projects and the period. It explores with read-only SQL and returns \`spec\`; pass it as it is to \`show\` so the user sees it, and don't repeat its numbers in text. If \`show\` reports errored blocks, call \`panel\` again with them.
When the user wants a panel but doesn't know what to show, interview first with one \`ask\` (what decision it supports, which projects and period matter), then propose 3–6 metrics with a MultiChoice and delegate the picks.`;

// The last ok draft rides on each RUN_FINISHED: the parent model gets it instead of the text.
async function* deliver(stream: AsyncIterable<StreamChunk>, state: { spec?: Draft }) {
  for await (const chunk of stream)
    yield chunk.type === "RUN_FINISHED" && state.spec
      ? { ...chunk, result: { spec: state.spec } }
      : chunk;
}

/**
 * The orchestrator's panel builder, for admins only: anyone else gets no `panel` at all. Built
 * inside the request, so its tools and recorder run as the actor once the stream is consumed.
 */
export function panel(input: { thread: string; model?: string }) {
  if (!Identity.can(Sql.Grant)) return undefined;
  const scope = AsyncLocalStorage.snapshot();
  return defineAgent({
    name: "panel",
    description:
      "Builds dashboard panels and answers data questions: explores the data with read-only SQL and returns a checked json-render spec for `show`.",
    run: (ctx) =>
      scope(() => {
        const sql = Sql.kit();
        const state: { spec?: Draft } = {};
        const draft = toolDefinition({
          name: "draft",
          description: instructions(
            "Checks a panel spec built from the components below, running each block's SQL, and keeps the last ok one as your result.",
          ),
          inputSchema: shape,
        }).server((spec) =>
          scope(async () => {
            const out = await check(spec, (query, limit) => Sql.run({ sql: query, limit }));
            if (out.ok) state.spec = spec;
            return out;
          }),
        );
        return deliver(
          chat({
            adapter: Model.text(input.model),
            messages: ctx.messages,
            ...ctx.forward,
            systemPrompts: [Agent.prompt, guide, ...sql.prompts],
            tools: [...sql.tools, draft],
            // Its own conversation: a child's messages never land in the orchestrator's thread.
            middleware: [
              relax,
              Agent.recorder({
                agent: "panel",
                thread: `${input.thread.slice(0, 180)}/${ctx.subagentRunId}`,
              }),
            ],
          }),
          state,
        );
      }),
  });
}
